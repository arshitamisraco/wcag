import { existsSync } from "node:fs";
import axe from "axe-core";
import type { AxeResults } from "axe-core";
import { chromium as playwrightChromium } from "playwright-core";
import type { Browser } from "playwright-core";
import { optionalEnv } from "@/lib/env";
import { assertScannableUrl } from "@/lib/url";
import type { ScanSummary } from "@/db/schema";

export { InvalidUrlError } from "@/lib/url";

export const USER_AGENT =
  "AI-A11y-Auditor/1.0 (+accessibility scanner; Playwright Chromium)";
const FALLBACK_CHROMIUM = "/opt/pw-browsers/chromium";

export type Violations = AxeResults["violations"];

export type ScanResult = {
  url: string;
  finalUrl: string;
  title: string;
  violations: Violations;
  summary: ScanSummary;
};

export type FlatIssue = {
  ruleId: string;
  impact: string | null;
  description: string;
  help: string;
  helpUrl: string;
  wcagTags: string[];
  selector: string;
  html: string;
  failureSummary: string | null;
};

async function launchBrowser(): Promise<Browser> {
  const override = optionalEnv().CHROMIUM_EXECUTABLE_PATH;
  if (override) {
    return playwrightChromium.launch({
      executablePath: override,
      headless: true,
      args: ["--no-sandbox"],
    });
  }
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const { default: sparticuz } = await import("@sparticuz/chromium");
    return playwrightChromium.launch({
      executablePath: await sparticuz.executablePath(),
      args: sparticuz.args,
      headless: true,
    });
  }
  if (existsSync(FALLBACK_CHROMIUM)) {
    return playwrightChromium.launch({
      executablePath: FALLBACK_CHROMIUM,
      headless: true,
      args: ["--no-sandbox"],
    });
  }
  throw new Error(
    "No Chromium available. Set CHROMIUM_EXECUTABLE_PATH to a local Chromium/Chrome binary (or run on Vercel).",
  );
}

export async function scanUrl(url: string): Promise<ScanResult> {
  await assertScannableUrl(url);
  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: USER_AGENT,
      bypassCSP: true,
    });
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    } catch (e) {
      const timedOut = e instanceof Error && e.name === "TimeoutError";
      if (!timedOut) throw e;
      await page.goto(url, { waitUntil: "load", timeout: 30000 });
    }
    const finalUrl = page.url();
    await assertScannableUrl(finalUrl);
    const title = await page.title();

    await page.addScriptTag({ content: axe.source });
    const axeLoaded = () =>
      page.evaluate(() => typeof (window as any).axe !== "undefined"); // eslint-disable-line @typescript-eslint/no-explicit-any
    let hasAxe = await axeLoaded();
    if (!hasAxe) {
      // Fallback: evaluate the source as a string inside the page.
      await page.evaluate(axe.source);
      hasAxe = await axeLoaded();
    }
    if (!hasAxe) {
      throw new Error(
        "Could not inject axe-core into the page (blocked by the page's Content-Security-Policy)",
      );
    }
    const results = (await page.evaluate(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).axe.run(document, {
        resultTypes: ["violations", "passes", "incomplete", "inapplicable"],
      }),
    )) as AxeResults;

    const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    for (const v of results.violations) {
      if (v.impact && v.impact in byImpact) byImpact[v.impact] += 1;
    }
    return {
      url,
      finalUrl,
      title,
      violations: results.violations,
      summary: {
        violations: results.violations.length,
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        inapplicable: results.inapplicable.length,
        byImpact,
      },
    };
  } finally {
    await browser.close();
  }
}

/** One row per violating node. */
export function flattenViolations(violations: Violations): FlatIssue[] {
  const rows: FlatIssue[] = [];
  for (const v of violations) {
    for (const node of v.nodes) {
      rows.push({
        ruleId: v.id,
        impact: node.impact ?? v.impact ?? null,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        wcagTags: v.tags.filter((t) => /^wcag/.test(t)),
        selector: node.target.map((t) => (Array.isArray(t) ? t.join(" ") : String(t))).join(" "),
        html: node.html,
        failureSummary: node.failureSummary ?? null,
      });
    }
  }
  return rows;
}
