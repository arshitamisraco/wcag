import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { ScanPoller } from "@/components/scan-poller";
import { StatusBadge } from "@/components/status-badge";
import type { Issue } from "@/db/schema";
import { IMPACTS, formatDateTime, impactClass } from "@/lib/format";
import { TrackOnMount } from "@/components/track-on-mount";
import { Delta } from "@/components/delta";
import { RescanButton } from "@/components/rescan-button";
import { getScanDetail, getSiteWithScans } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Scan results | AI Accessibility Auditor" };

function group(issues: Issue[]) {
  const map = new Map<string, Issue[]>();
  for (const i of issues) {
    const list = map.get(i.ruleId);
    if (list) list.push(i);
    else map.set(i.ruleId, [i]);
  }
  return [...map.values()];
}

function Card({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-300 p-4">
      <dt className="text-sm font-medium text-gray-800">{label}</dt>
      <dd className="mt-1 text-3xl font-bold">{value}</dd>
      {sub ? <dd className="text-xs text-gray-700">{sub}</dd> : null}
    </div>
  );
}

function AiBlock({ issue }: { issue: Issue }) {
  if (issue.aiStatus === "done") {
    return (
      <div className="mt-3 space-y-3 rounded-md bg-gray-50 p-3">
        <div>
          <h4 className="text-sm font-semibold">Why it matters</h4>
          <p className="mt-1 text-sm text-gray-900">{issue.aiExplanation}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Suggested fix</h4>
          <p className="mt-1 text-sm text-gray-900">{issue.aiFixSummary}</p>
        </div>
        {issue.aiFixCode ? (
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Fixed HTML</h4>
              <CopyButton text={issue.aiFixCode} />
            </div>
            <pre className="mt-1 overflow-x-auto rounded bg-gray-900 p-3 text-xs text-gray-50">
              <code>{issue.aiFixCode}</code>
            </pre>
          </div>
        ) : null}
      </div>
    );
  }
  const text: Record<string, string> = {
    pending: "AI explanation pending...",
    skipped: "AI explanation skipped (limit reached or AI not configured).",
    failed: "AI explanation failed for this issue.",
  };
  return <p className="mt-3 text-sm text-gray-800">{text[issue.aiStatus]}</p>;
}

export default async function ScanPage({ params }: PageProps<"/scans/[id]">) {
  const { id } = await params;
  const detail = await getScanDetail(id).catch(() => null);
  if (!detail) notFound();
  const { scan, site, issues } = detail;
  const active = scan.status === "queued" || scan.status === "running";
  const summary = scan.summary;
  const groups = group(issues);

  let previous: { id: string; violations: number } | null = null;
  if (scan.status === "completed" && summary) {
    const history = await getSiteWithScans(site.id).catch(() => null);
    const older = history?.scans.find(
      (s) => s.id !== scan.id && s.status === "completed" && s.summary && s.createdAt < scan.createdAt,
    );
    if (older?.summary) previous = { id: older.id, violations: older.summary.violations };
  }

  return (
    <div className="space-y-8">
      <TrackOnMount
        event="scan_viewed"
        props={{ scan_id: scan.id, status: scan.status, violations: summary?.violations ?? 0 }}
      />
      <div>
        <Link href="/" className="text-sm text-blue-800 underline">
          Back to all scans
        </Link>
        <h1 className="mt-2 break-all text-3xl font-bold">{site.url}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-800">
          <StatusBadge status={scan.status} />
          <span>Requested {formatDateTime(scan.createdAt)}</span>
          {scan.startedAt ? <span>Started {formatDateTime(scan.startedAt)}</span> : null}
          {scan.finishedAt ? <span>Finished {formatDateTime(scan.finishedAt)}</span> : null}
        </p>
        <div className="mt-4 flex flex-wrap items-start gap-x-6 gap-y-3">
          <Link href={`/sites/${site.id}`} className="py-2 text-blue-800 underline">
            View site history
          </Link>
          <RescanButton siteId={site.id} label="Re-scan" />
        </div>
        {previous && summary ? (
          <p className="mt-3">
            <Delta current={summary.violations} previous={previous.violations} />{" "}
            <Link href={`/scans/${scan.id}/compare/${previous.id}`} className="text-sm text-blue-800 underline">
              Compare with previous scan
            </Link>
          </p>
        ) : null}
      </div>

      {active ? <ScanPoller scanId={scan.id} initialStatus={scan.status} /> : null}

      {scan.status === "failed" ? (
        <div role="alert" className="rounded-md border border-red-700 bg-red-50 px-4 py-3 text-red-950">
          <strong>Scan failed.</strong> {scan.error ?? "Unknown error."}
        </div>
      ) : null}

      {summary ? (
        <section aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="text-2xl font-semibold">Summary</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card label="Violations" value={summary.violations} />
            <Card label="Passes" value={summary.passes} />
            <Card label="Needs review" value={summary.incomplete} />
            <Card label="Not applicable" value={summary.inapplicable} />
          </dl>
          <h3 className="mt-5 text-lg font-semibold">Violations by impact</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {IMPACTS.map((k) => (
              <li
                key={k}
                className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${impactClass(k)}`}
              >
                {k}: {summary.byImpact[k]}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {issues.length > 0 ? (
        <section aria-labelledby="issues-heading" className="space-y-6">
          <h2 id="issues-heading" className="text-2xl font-semibold">Issues</h2>
          {groups.map((g) => {
            const first = g[0];
            return (
              <article
                key={first.ruleId}
                aria-labelledby={`rule-${first.ruleId}`}
                className="rounded-lg border border-gray-300 p-4"
              >
                <header className="space-y-2">
                  <h3 id={`rule-${first.ruleId}`} className="text-lg font-semibold">
                    {first.help}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${impactClass(first.impact)}`}
                    >
                      {first.impact ?? "unknown"}
                    </span>
                    {first.wcagTags.map((t) => (
                      <span key={t} className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-900">
                        {t}
                      </span>
                    ))}
                    <a
                      href={first.helpUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-blue-800 underline"
                    >
                      Learn more<span className="sr-only"> about {first.ruleId} (opens in new tab)</span>
                    </a>
                    <span className="text-gray-800">
                      {g.length} {g.length === 1 ? "element" : "elements"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{first.description}</p>
                </header>
                <ul className="mt-4 space-y-4">
                  {g.map((issue) => (
                    <li key={issue.id} className="rounded-md border border-gray-200 p-3">
                      <p className="text-sm">
                        <span className="font-semibold">Selector: </span>
                        <code className="break-all font-mono text-xs">{issue.selector}</code>
                      </p>
                      <pre className="mt-2 overflow-x-auto rounded bg-gray-100 p-3 text-xs text-gray-900">
                        <code>{issue.html}</code>
                      </pre>
                      <AiBlock issue={issue} />
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>
      ) : scan.status === "completed" ? (
        <p className="text-gray-800">No violations were detected by automated checks.</p>
      ) : null}
    </div>
  );
}
