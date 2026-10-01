import Link from "next/link";
import { ScanForm } from "@/components/scan-form";
import { StatusBadge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/format";
import { recentScans } from "@/lib/queries";

export const dynamic = "force-dynamic";

async function loadRecent() {
  try {
    return { scans: await recentScans(20), error: null };
  } catch {
    return { scans: [], error: "Recent scans are unavailable (is DATABASE_URL configured?)." };
  }
}

export default async function Home() {
  const { scans, error } = await loadRecent();
  return (
    <div className="space-y-12">
      <section aria-labelledby="hero-heading" className="space-y-4">
        <h1 id="hero-heading" className="text-4xl font-bold tracking-tight">
          Find accessibility issues. Get the fix.
        </h1>
        <p className="max-w-2xl text-lg text-gray-800">
          Enter a page URL. We scan it with axe-core against WCAG, then Claude explains each issue
          in plain language and writes the corrected HTML.
        </p>
        <ScanForm />
      </section>

      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="text-2xl font-semibold">
          Recent scans
        </h2>
        {error ? (
          <p className="mt-3 text-gray-800">{error}</p>
        ) : scans.length === 0 ? (
          <p className="mt-3 text-gray-800">No scans yet. Run your first scan above.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Most recent accessibility scans</caption>
              <thead>
                <tr className="border-b border-gray-300 text-gray-800">
                  <th scope="col" className="py-2 pr-4 font-semibold">URL</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Status</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Violations</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {scans.map((s) => (
                  <tr key={s.id} className="border-b border-gray-200">
                    <td className="max-w-xs truncate py-2 pr-4">
                      <Link
                        href={`/sites/${s.siteId}`}
                        className="text-blue-800 underline hover:text-blue-950"
                      >
                        {s.url}
                      </Link>
                    </td>
                    <td className="py-2 pr-4"><StatusBadge status={s.status} /></td>
                    <td className="py-2 pr-4">{s.summary ? s.summary.violations : "-"}</td>
                    <td className="py-2 pr-4 text-gray-800">
                      <Link href={`/scans/${s.id}`} className="text-blue-800 underline hover:text-blue-950">
                        {timeAgo(s.createdAt)}
                        <span className="sr-only"> (view scan)</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
