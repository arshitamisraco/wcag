import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { compareScans, type CompareIssue } from "@/lib/compare";
import { formatDateTime, impactClass } from "@/lib/format";
import { getScanHeader, getScanIssuesForCompare, type ScanHeader } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Compare scans | AI Accessibility Auditor" };

function Message({ title, children, siteId }: { title: string; children: React.ReactNode; siteId?: string }) {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-gray-800">{children}</p>
      <p>
        <Link href={siteId ? `/sites/${siteId}` : "/"} className="text-blue-800 underline">
          {siteId ? "Back to site history" : "Back to home"}
        </Link>
      </p>
    </div>
  );
}

function ScanCard({ role, scan }: { role: string; scan: ScanHeader }) {
  return (
    <div className="rounded-lg border border-gray-300 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-800">{role}</h2>
      <p className="mt-1 font-semibold">{formatDateTime(scan.createdAt)}</p>
      <p className="mt-1 text-sm text-gray-900">
        {scan.summary?.violations ?? 0} violations ·{" "}
        <Link href={`/scans/${scan.id}`} className="text-blue-800 underline">
          View scan<span className="sr-only"> from {formatDateTime(scan.createdAt)}</span>
        </Link>
      </p>
    </div>
  );
}

const BUCKETS = {
  fixed: { title: "Fixed", sign: "−", card: "border-green-700 bg-green-50 text-green-950" },
  new: { title: "New", sign: "+", card: "border-red-700 bg-red-50 text-red-950" },
  persisting: { title: "Persisting", sign: "=", card: "border-gray-500 bg-gray-50 text-gray-900" },
} as const;

function IssueList({ issues }: { issues: CompareIssue[] }) {
  if (issues.length === 0) return <p className="mt-2 text-sm text-gray-800">None.</p>;
  return (
    <ul className="mt-3 space-y-3">
      {issues.map((i) => (
        <li key={`${i.ruleId}::${i.selector}`} className="rounded-md border border-gray-200 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{i.help}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${impactClass(i.impact)}`}>
              {i.impact ?? "unknown"}
            </span>
            <a href={i.helpUrl} target="_blank" rel="noreferrer noopener" className="text-blue-800 underline">
              Learn more<span className="sr-only"> about {i.ruleId} (opens in new tab)</span>
            </a>
          </div>
          <p className="mt-1">
            <span className="font-semibold">Selector: </span>
            <code className="break-all font-mono text-xs">{i.selector}</code>
          </p>
        </li>
      ))}
    </ul>
  );
}

export default async function ComparePage({ params }: PageProps<"/scans/[id]/compare/[otherId]">) {
  const { id, otherId } = await params;
  const loaded = await Promise.all([getScanHeader(id), getScanHeader(otherId)]).catch(() => null);
  if (!loaded) {
    return <Message title="Comparison unavailable">Scan data could not be loaded. Please try again later.</Message>;
  }
  const [a, b] = loaded;
  if (!a || !b) notFound();
  if (a.siteId !== b.siteId) {
    return (
      <Message title="Cannot compare these scans">
        These scans belong to different sites. Only scans of the same site can be compared.
      </Message>
    );
  }
  if (a.status !== "completed" || b.status !== "completed") {
    return (
      <Message title="Comparison not ready" siteId={a.siteId}>
        Both scans must be completed before they can be compared. Current statuses:{" "}
        <StatusBadge status={a.status} /> and <StatusBadge status={b.status} />.
      </Message>
    );
  }

  const [base, target] = a.createdAt <= b.createdAt ? [a, b] : [b, a];
  const [baseIssues, targetIssues] = await Promise.all([
    getScanIssuesForCompare(base.id),
    getScanIssuesForCompare(target.id),
  ]);
  const result = compareScans(baseIssues, targetIssues);

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/sites/${base.siteId}`} className="text-sm text-blue-800 underline">
          Back to site history
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Scan comparison</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ScanCard role="Base (older)" scan={base} />
        <ScanCard role="Target (newer)" scan={target} />
      </div>

      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="text-2xl font-semibold">Summary</h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(["fixed", "new", "persisting"] as const).map((k) => (
            <div key={k} className={`rounded-lg border p-4 ${BUCKETS[k].card}`}>
              <dt className="text-sm font-medium">{BUCKETS[k].title}</dt>
              <dd className="mt-1 text-3xl font-bold">
                <span aria-hidden="true">{BUCKETS[k].sign} </span>
                {result.counts[k]}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-sm text-gray-800">
          {result.counts.baseTotal} issues in the base scan, {result.counts.targetTotal} in the target scan.
        </p>
      </section>

      <section aria-labelledby="rules-heading">
        <h2 id="rules-heading" className="text-2xl font-semibold">By rule</h2>
        {result.byRule.length === 0 ? (
          <p className="mt-3 text-gray-800">No violations in either scan.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Changes per accessibility rule</caption>
              <thead>
                <tr className="border-b border-gray-300 text-gray-800">
                  <th scope="col" className="py-2 pr-4 font-semibold">Rule</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Impact</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Fixed</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">New</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Persisting</th>
                </tr>
              </thead>
              <tbody>
                {result.byRule.map((r) => (
                  <tr key={r.ruleId} className="border-b border-gray-200">
                    <th scope="row" className="py-2 pr-4 font-normal">
                      {r.help}{" "}
                      <a href={r.helpUrl} target="_blank" rel="noreferrer noopener" className="text-blue-800 underline">
                        Learn more<span className="sr-only"> about {r.ruleId} (opens in new tab)</span>
                      </a>
                    </th>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${impactClass(r.impact)}`}>
                        {r.impact ?? "unknown"}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{r.fixed}</td>
                    <td className="py-2 pr-4">{r.new}</td>
                    <td className="py-2 pr-4">{r.persisting}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="details-heading" className="space-y-3">
        <h2 id="details-heading" className="text-2xl font-semibold">Issue details</h2>
        {(["fixed", "new", "persisting"] as const).map((k) => (
          <details key={k} className="rounded-lg border border-gray-300 p-4" open={k === "new" && result.new.length > 0}>
            <summary className="cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900">
              {BUCKETS[k].title} ({result.counts[k]})
            </summary>
            <IssueList issues={result[k]} />
          </details>
        ))}
      </section>
    </div>
  );
}
