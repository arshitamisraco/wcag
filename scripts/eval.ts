/**
 * Eval harness: for each fixture, scan -> AI fixes -> apply -> re-scan -> measure.
 * Usage: pnpm eval [--fixture <name>] [--dry-run] [--max-issues N]
 */
import "./load-env";
import { existsSync } from "node:fs";
import { appendFile, copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

process.env.ALLOW_PRIVATE_URLS = "1";
if (!process.env.CHROMIUM_EXECUTABLE_PATH && existsSync("/opt/pw-browsers/chromium")) {
  process.env.CHROMIUM_EXECUTABLE_PATH = "/opt/pw-browsers/chromium";
}

import { applyFixes } from "../src/lib/apply-fix";
import { explainIssuesBatch } from "../src/lib/ai";
import type { Explanation } from "../src/lib/ai";
import { flattenViolations, scanUrl } from "../src/lib/scanner";
import type { FlatIssue } from "../src/lib/scanner";

const ROOT = path.resolve(__dirname, "..");
const FIXTURES_DIR = path.join(ROOT, "eval", "fixtures");
const RESULTS_DIR = path.join(ROOT, "eval", "results");
const HISTORY = path.join(RESULTS_DIR, "history.csv");
const HISTORY_HEADER =
  "timestamp,model,fixtures,baseline,resolved,resolvedPct,ruleResolvedPct,introduced";

type Args = { fixture?: string; dryRun: boolean; maxIssues: number };

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false, maxIssues: 50 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--fixture") args.fixture = argv[++i];
    else if (a === "--max-issues") {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n < 0) throw new Error("--max-issues needs a non-negative integer");
      args.maxIssues = n;
    } else throw new Error(`Unknown argument: ${a}`);
  }
  return args;
}

const key = (i: Pick<FlatIssue, "ruleId" | "selector">) => `${i.ruleId}::${i.selector}`;
const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 1000) / 10);

type IssueRecord = {
  ruleId: string;
  impact: string | null;
  selector: string;
  html: string;
  fix: { explanation: string; fixSummary: string; fixCode: string } | null;
  fixError: string | null;
  applied: boolean;
  applyFailure: string | null;
  resolved: boolean;
};

type FixtureResult = {
  fixture: string;
  baselineViolations: number;
  fixesGenerated: number;
  fixesApplied: number;
  resolved: number;
  introduced: number;
  resolvedPct: number;
  ruleResolved: number;
  ruleResolvedPct: number;
  byRule: Record<string, { baseline: number; after: number; resolved: number; ruleResolved: number }>;
  introducedKeys: string[];
  issues: IssueRecord[];
};

async function runFixture(
  name: string,
  baseUrl: string,
  outDir: string,
  args: Args,
): Promise<FixtureResult> {
  const baseline = flattenViolations((await scanUrl(`${baseUrl}${name}.html`)).violations);
  const target = baseline.slice(0, args.maxIssues);

  const fixes = new Map<FlatIssue, Explanation>();
  const fixErrors = new Map<FlatIssue, string>();
  if (!args.dryRun && target.length > 0) {
    const results = await explainIssuesBatch(target, { concurrency: 4 });
    for (const r of results) {
      if (r.ok) fixes.set(r.input, r.value);
      else fixErrors.set(r.input, r.error);
    }
  }

  const original = await readFile(path.join(FIXTURES_DIR, `${name}.html`), "utf8");
  const toApply = [...fixes].map(([issue, ex]) => ({ selector: issue.selector, fixCode: ex.fixCode }));
  const applied = applyFixes(original, toApply);
  const failureBySelector = new Map(applied.failed.map((f) => [f.selector, f.reason]));
  await writeFile(path.join(outDir, "fixed", `${name}.html`), applied.html);

  const after = flattenViolations((await scanUrl(`${baseUrl}fixed/${name}.html`)).violations);
  const afterKeys = new Set(after.map(key));
  const baselineKeys = new Set(baseline.map(key));

  const issues: IssueRecord[] = baseline.map((issue) => {
    const ex = fixes.get(issue) ?? null;
    const failure = ex ? (failureBySelector.get(issue.selector) ?? null) : null;
    return {
      ruleId: issue.ruleId,
      impact: issue.impact,
      selector: issue.selector,
      html: issue.html,
      fix: ex && { explanation: ex.explanation, fixSummary: ex.fixSummary, fixCode: ex.fixCode },
      fixError: fixErrors.get(issue) ?? (args.dryRun ? "dry-run" : target.includes(issue) ? null : "over --max-issues cap"),
      applied: ex !== null && failure === null,
      applyFailure: failure,
      resolved: !afterKeys.has(key(issue)),
    };
  });

  const byRule: FixtureResult["byRule"] = {};
  for (const i of baseline) (byRule[i.ruleId] ??= { baseline: 0, after: 0, resolved: 0, ruleResolved: 0 }).baseline++;
  for (const i of after) (byRule[i.ruleId] ??= { baseline: 0, after: 0, resolved: 0, ruleResolved: 0 }).after++;
  for (const rec of issues) if (rec.resolved) byRule[rec.ruleId].resolved++;
  let ruleResolved = 0;
  for (const r of Object.values(byRule)) {
    r.ruleResolved = Math.max(0, r.baseline - r.after);
    ruleResolved += r.ruleResolved;
  }

  const introducedKeys = [...afterKeys].filter((k) => !baselineKeys.has(k));
  const resolved = issues.filter((i) => i.resolved).length;
  return {
    fixture: name,
    baselineViolations: baseline.length,
    fixesGenerated: fixes.size,
    fixesApplied: applied.applied,
    resolved,
    introduced: introducedKeys.length,
    resolvedPct: pct(resolved, baseline.length),
    ruleResolved,
    ruleResolvedPct: pct(ruleResolved, baseline.length),
    byRule,
    introducedKeys,
    issues,
  };
}

function table(headers: string[], rows: (string | number)[][]): string {
  const line = (cells: (string | number)[]) => `| ${cells.join(" | ")} |`;
  return [line(headers), line(headers.map(() => "---")), ...rows.map(line)].join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.dryRun && !process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set. Set it, or pass --dry-run to skip the AI call.");
    process.exit(1);
  }
  const model = args.dryRun ? "dry-run" : process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

  const all = (await readdir(FIXTURES_DIR)).filter((f) => f.endsWith(".html")).map((f) => f.slice(0, -5)).sort();
  const names = args.fixture ? all.filter((n) => n === args.fixture) : all;
  if (names.length === 0) {
    console.error(`No fixtures found${args.fixture ? ` matching "${args.fixture}"` : ""}. Available: ${all.join(", ")}`);
    process.exit(1);
  }

  const outDir = await mkdtemp(path.join(tmpdir(), "a11y-eval-"));
  await mkdir(path.join(outDir, "fixed"));
  for (const n of names) await copyFile(path.join(FIXTURES_DIR, `${n}.html`), path.join(outDir, `${n}.html`));

  const server = createServer(async (req, res) => {
    const rel = decodeURIComponent((req.url ?? "/").split("?")[0]);
    const file = path.join(outDir, path.normalize(rel));
    if (!file.startsWith(outDir + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    let body: Buffer;
    try {
      body = await readFile(file);
    } catch {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(body);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;

  const results: FixtureResult[] = [];
  try {
    for (const name of names) {
      console.error(`Evaluating ${name}...`);
      results.push(await runFixture(name, baseUrl, outDir, args));
    }
  } finally {
    server.close();
    await rm(outDir, { recursive: true, force: true });
  }

  const sum = (f: (r: FixtureResult) => number) => results.reduce((a, r) => a + f(r), 0);
  const baseline = sum((r) => r.baselineViolations);
  const resolved = sum((r) => r.resolved);
  const ruleResolved = sum((r) => r.ruleResolved);
  const introduced = sum((r) => r.introduced);
  const overall = {
    fixtures: results.length,
    baselineViolations: baseline,
    fixesGenerated: sum((r) => r.fixesGenerated),
    fixesApplied: sum((r) => r.fixesApplied),
    resolved,
    resolvedPct: pct(resolved, baseline),
    ruleResolved,
    ruleResolvedPct: pct(ruleResolved, baseline),
    introduced,
  };

  const perRule: Record<string, { baseline: number; resolved: number; ruleResolved: number }> = {};
  for (const r of results)
    for (const [rule, v] of Object.entries(r.byRule)) {
      const a = (perRule[rule] ??= { baseline: 0, resolved: 0, ruleResolved: 0 });
      a.baseline += v.baseline;
      a.resolved += v.resolved;
      a.ruleResolved += v.ruleResolved;
    }

  const timestamp = new Date().toISOString();
  await mkdir(RESULTS_DIR, { recursive: true });
  const file = path.join(RESULTS_DIR, `${timestamp.replace(/:/g, "-")}.json`);
  await writeFile(
    file,
    JSON.stringify({ timestamp, model, dryRun: args.dryRun, maxIssues: args.maxIssues, overall, perRule, fixtures: results }, null, 2),
  );
  if (!args.dryRun) {
    if (!existsSync(HISTORY)) await writeFile(HISTORY, HISTORY_HEADER + "\n");
    await appendFile(
      HISTORY,
      [timestamp, model, results.length, baseline, resolved, overall.resolvedPct, overall.ruleResolvedPct, introduced].join(",") + "\n",
    );
  }

  const out = [
    `## Eval results (${timestamp}, model: ${model}${args.dryRun ? ", DRY RUN" : ""})`,
    "",
    table(
      ["Fixture", "Baseline", "Fixes", "Applied", "Resolved", "Introduced", "Resolved %", "Rule-resolved %"],
      [
        ...results.map((r) => [r.fixture, r.baselineViolations, r.fixesGenerated, r.fixesApplied, r.resolved, r.introduced, `${r.resolvedPct}%`, `${r.ruleResolvedPct}%`]),
        ["**Overall**", baseline, overall.fixesGenerated, overall.fixesApplied, resolved, introduced, `${overall.resolvedPct}%`, `${overall.ruleResolvedPct}%`],
      ],
    ),
    "",
    table(
      ["Rule", "Baseline", "Resolved", "Rule-resolved", "Resolved %"],
      Object.entries(perRule)
        .sort((a, b) => b[1].baseline - a[1].baseline || a[0].localeCompare(b[0]))
        .map(([rule, v]) => [rule, v.baseline, v.resolved, v.ruleResolved, `${pct(v.resolved, v.baseline)}%`]),
    ),
    "",
    `Details: ${path.relative(ROOT, file)}`,
  ];
  console.log(out.join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
