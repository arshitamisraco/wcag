import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Delta } from "@/components/delta";
import { RescanButton } from "@/components/rescan-button";
import { StatusBadge } from "@/components/status-badge";
import { IMPACTS, formatDateTime } from "@/lib/format";
import { getSiteWithScans } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Site history | AI Accessibility Auditor" };

export default async function SitePage({ params }: PageProps<"/sites/[id]">) {
  const { id } = await params;
  const data = await getSiteWithScans(id).catch(() => null);
  if (!data) notFound();
  const { site, scans } = data;
  const completed = scans.filter((s) => s.status === "completed" && s.summary);
  const prevOf = new Map<string, string>();
  completed.forEach((s, i) => {
    if (completed[i + 1]) prevOf.set(s.id, completed[i + 1].id);
  });
  const latest = completed[0];
  const previous = completed[1];

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-blue-800 underline">
          Back to all scans
        </Link>
        <h1 className="mt-2 break-all text-3xl font-bold">{site.url}</h1>
        <p className="mt-1 text-sm text-gray-800">Scan history</p>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        {latest?.summary && previous?.summary ? (
          <p className="text-lg">
            <Delta current={latest.summary.violations} previous={previous.summary.violations} />{" "}
            <Link
              href={`/scans/${latest.id}/compare/${previous.id}`}
              className="text-sm text-blue-800 underline"
            >
              View comparison
            </Link>
          </p>
        ) : (
          <p className="text-gray-800">Run at least two scans to see how this site changes over time.</p>
        )}
        <RescanButton siteId={site.id} />
      </div>

      <section aria-labelledby="scans-heading">
        <h2 id="scans-heading" className="text-2xl font-semibold">Scans</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Scans of {site.url}, newest first</caption>
            <thead>
              <tr className="border-b border-gray-300 text-gray-800">
                <th scope="col" className="py-2 pr-4 font-semibold">Date</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Status</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Violations</th>
                <th scope="col" className="py-2 pr-4 font-semibold">By impact</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((s) => {
                const prev = prevOf.get(s.id);
                return (
                  <tr key={s.id} className="border-b border-gray-200">
                    <th scope="row" className="py-2 pr-4 font-normal">
                      {formatDateTime(s.createdAt)}
                    </th>
                    <td className="py-2 pr-4"><StatusBadge status={s.status} /></td>
                    <td className="py-2 pr-4">{s.summary ? s.summary.violations : "-"}</td>
                    <td className="py-2 pr-4 text-gray-900">
                      {s.summary
                        ? IMPACTS.map((k) => `${k[0].toUpperCase()}${k.slice(1, 4)} ${s.summary!.byImpact[k]}`).join(" · ")
                        : "-"}
                    </td>
                    <td className="space-x-3 py-2 pr-4">
                      <Link href={`/scans/${s.id}`} className="text-blue-800 underline">
                        View<span className="sr-only"> scan from {formatDateTime(s.createdAt)}</span>
                      </Link>
                      {prev ? (
                        <Link href={`/scans/${s.id}/compare/${prev}`} className="text-blue-800 underline">
                          Compare with previous
                          <span className="sr-only"> for scan from {formatDateTime(s.createdAt)}</span>
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
