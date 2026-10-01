import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Delta } from "@/components/delta";
import { DotsRow, Zigzag } from "@/components/doodles";
import { FadeIn } from "@/components/motion/fade-in";
import { Float } from "@/components/motion/float";
import { RescanButton } from "@/components/rescan-button";
import { Alert } from "@/components/ui/alert";
import { ImpactBadge, StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable, Td, Th, Tr } from "@/components/ui/data-table";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
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
    <div className="relative -mx-2 space-y-8 overflow-x-clip px-2 pb-2">
      <nav aria-label="Breadcrumb">
        <TextLink href="/" className="text-sm">
          <span aria-hidden="true">← </span>
          Back to all scans
        </TextLink>
      </nav>

      <FadeIn className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 hidden md:block"
        >
          <Float amplitude={6} duration={5}>
            <Zigzag className="h-10 w-28 text-sky-deep" />
          </Float>
          <Float amplitude={5} duration={4} delay={0.6} className="ml-14 mt-1">
            <DotsRow className="h-5 w-20 text-yellow" />
          </Float>
        </div>
        <div className="md:pr-40">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-2">Scan history</p>
          <h1 className="mt-1 break-all font-display text-3xl font-bold sm:text-4xl">{site.url}</h1>
        </div>
      </FadeIn>

      <div className="flex flex-wrap items-start justify-between gap-4">
        {latest?.summary && previous?.summary ? (
          <Card className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-xl">
              <Delta current={latest.summary.violations} previous={previous.summary.violations} />
            </p>
            <TextLink href={`/scans/${latest.id}/compare/${previous.id}`} className="text-sm text-ink">
              View comparison
            </TextLink>
          </Card>
        ) : (
          <Alert tone="neutral" className="max-w-prose">
            <p>Run at least two scans to see how this site changes over time.</p>
          </Alert>
        )}
        <RescanButton siteId={site.id} />
      </div>

      <section aria-labelledby="scans-heading" className="space-y-4">
        <SectionHeading id="scans-heading">Scans</SectionHeading>
        <FadeIn delay={0.1}>
          <DataTable caption={`Scans of ${site.url}, newest first`} label="Scan history">
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Status</Th>
                <Th>Violations</Th>
                <Th>By impact</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {scans.map((s) => {
                const prev = prevOf.get(s.id);
                const when = formatDateTime(s.createdAt);
                return (
                  <Tr key={s.id} className="last:[&>th]:border-b-0">
                    <th
                      scope="row"
                      className="whitespace-nowrap border-b border-sand px-4 py-3 text-left align-top font-normal"
                    >
                      {when}
                    </th>
                    <Td>
                      <StatusBadge status={s.status} />
                    </Td>
                    <Td>
                      {s.summary ? (
                        <span className="font-display font-bold">{s.summary.violations}</span>
                      ) : (
                        <>
                          <span aria-hidden="true">–</span>
                          <span className="sr-only">not available</span>
                        </>
                      )}
                    </Td>
                    <Td>
                      {s.summary ? (
                        <ul className="flex min-w-72 flex-wrap gap-1">
                          {IMPACTS.map((k) => (
                            <li key={k} className="inline-flex items-center gap-1">
                              <ImpactBadge impact={k} />
                              <span className="font-bold">{s.summary!.byImpact[k]}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <>
                          <span aria-hidden="true">–</span>
                          <span className="sr-only">not available</span>
                        </>
                      )}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <TextLink href={`/scans/${s.id}`}>
                          View<span className="sr-only"> scan from {when}</span>
                        </TextLink>
                        {prev ? (
                          <TextLink href={`/scans/${s.id}/compare/${prev}`}>
                            Compare with previous
                            <span className="sr-only"> for scan from {when}</span>
                          </TextLink>
                        ) : null}
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </DataTable>
        </FadeIn>
      </section>
    </div>
  );
}
