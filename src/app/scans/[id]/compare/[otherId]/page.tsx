import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Squiggle, Starburst } from "@/components/doodles";
import { FadeIn } from "@/components/motion/fade-in";
import { Float } from "@/components/motion/float";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { TrackOnMount } from "@/components/track-on-mount";
import { ImpactBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { DataTable, Td, Th, Tr } from "@/components/ui/data-table";
import { Pill } from "@/components/ui/pill";
import { SectionHeading } from "@/components/ui/section-heading";
import { Stat } from "@/components/ui/stat";
import type { Tone } from "@/components/ui/tones";
import { TextLink } from "@/components/ui/text-link";
import { compareScans, type CompareIssue } from "@/lib/compare";
import { formatDateTime } from "@/lib/format";
import { getScanHeader, getScanIssuesForCompare, type ScanHeader } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Compare scans | AI Accessibility Auditor" };

function Message({ title, children, siteId }: { title: string; children: React.ReactNode; siteId?: string }) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-8 text-center">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="text-ink-2">{children}</p>
      <div>
        <Button href={siteId ? `/sites/${siteId}` : "/"} variant="ghost">
          {siteId ? "Back to site history" : "Back to home"}
        </Button>
      </div>
    </div>
  );
}

function ScanCard({ role, scan }: { role: string; scan: ScanHeader }) {
  const when = formatDateTime(scan.createdAt);
  return (
    <Card>
      <p>
        <CardLabel>{role}</CardLabel>
      </p>
      <p className="mt-1 font-display text-xl font-bold">{when}</p>
      <p className="mt-2 text-sm text-ink">
        {scan.summary?.violations ?? 0} violations ·{" "}
        <TextLink href={`/scans/${scan.id}`}>
          View scan<span className="sr-only"> from {when}</span>
        </TextLink>
      </p>
    </Card>
  );
}

const BUCKETS = {
  fixed: { title: "Fixed", sign: "−", tone: "green-soft" },
  new: { title: "New", sign: "+", tone: "orange" },
  persisting: { title: "Persisting", sign: "=", tone: "paper" },
} as const satisfies Record<string, { title: string; sign: string; tone: Tone }>;

function Chevron() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="shrink-0 transition-transform duration-200 group-open:rotate-180"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IssueList({ issues }: { issues: CompareIssue[] }) {
  if (issues.length === 0) return <p className="mt-3 text-ink-2">None.</p>;
  return (
    <Stagger as="ul" className="mt-3 space-y-3">
      {issues.map((i) => (
        <StaggerItem
          as="li"
          key={`${i.ruleId}::${i.selector}`}
          className="rounded-xl border-2 border-ink bg-cream p-4 text-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold">{i.help}</span>
            <ImpactBadge impact={i.impact} />
            <TextLink href={i.helpUrl} external>
              Learn more<span className="sr-only"> about {i.ruleId}</span>
            </TextLink>
          </div>
          <p className="mt-2">
            <span className="font-bold">Selector: </span>
            <code className="break-all rounded bg-sand px-1 font-mono text-sm">{i.selector}</code>
          </p>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

function Zero() {
  return <span className="text-ink-2">0</span>;
}

function Count({ n }: { n: number }) {
  return n === 0 ? <Zero /> : <span className="font-display font-bold">{n}</span>;
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
    <div className="relative -mx-2 space-y-8 overflow-x-clip px-2 pb-2">
      <TrackOnMount
        event="compare_viewed"
        props={{
          base_scan_id: base.id,
          target_scan_id: target.id,
          fixed: result.counts.fixed,
          new: result.counts.new,
          persisting: result.counts.persisting,
        }}
      />
      <nav aria-label="Breadcrumb">
        <TextLink href={`/sites/${base.siteId}`} className="text-sm">
          <span aria-hidden="true">← </span>
          Back to site history
        </TextLink>
      </nav>

      <FadeIn className="relative">
        <div aria-hidden="true" className="pointer-events-none absolute right-2 top-0 hidden md:block">
          <Float amplitude={6} duration={5} rotate={6}>
            <Starburst className="h-16 w-16" />
          </Float>
        </div>
        <p className="text-xs font-bold uppercase tracking-wide text-ink-2">Compare</p>
        <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Scan comparison</h1>
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <ScanCard role="Base (older)" scan={base} />
        <div aria-hidden="true" className="hidden sm:block">
          <Squiggle className="h-8 w-16 text-orange" />
        </div>
        <ScanCard role="Target (newer)" scan={target} />
      </div>

      <section aria-labelledby="summary-heading" className="space-y-4">
        <SectionHeading id="summary-heading">Summary</SectionHeading>
        <dl className="grid gap-4 sm:grid-cols-3">
          {(["fixed", "new", "persisting"] as const).map((k) => (
            <Stat
              key={k}
              tone={BUCKETS[k].tone}
              value={result.counts[k]}
              label={
                <>
                  <span className="text-ink">{BUCKETS[k].title}</span>
                  <span
                    aria-hidden="true"
                    className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-paper font-display text-lg font-bold normal-case tracking-normal text-ink"
                  >
                    {BUCKETS[k].sign}
                  </span>
                </>
              }
            />
          ))}
        </dl>
        <p className="text-ink-2">
          {result.counts.baseTotal} issues in the base scan, {result.counts.targetTotal} in the target scan.
        </p>
      </section>

      <section aria-labelledby="rules-heading" className="space-y-4">
        <SectionHeading id="rules-heading">By rule</SectionHeading>
        {result.byRule.length === 0 ? (
          <p className="text-ink-2">No violations in either scan.</p>
        ) : (
          <DataTable caption="Changes per accessibility rule" label="Changes by rule">
            <thead>
              <tr>
                <Th>Rule</Th>
                <Th>Impact</Th>
                <Th>Fixed</Th>
                <Th>New</Th>
                <Th>Persisting</Th>
              </tr>
            </thead>
            <tbody>
              {result.byRule.map((r) => (
                <Tr key={r.ruleId} className="last:[&>th]:border-b-0">
                  <th scope="row" className="min-w-56 border-b border-sand px-4 py-3 text-left align-top font-normal">
                    {r.help}{" "}
                    <TextLink href={r.helpUrl} external>
                      Learn more<span className="sr-only"> about {r.ruleId}</span>
                    </TextLink>
                  </th>
                  <Td>
                    <ImpactBadge impact={r.impact} />
                  </Td>
                  <Td>
                    <Count n={r.fixed} />
                  </Td>
                  <Td>
                    <Count n={r.new} />
                  </Td>
                  <Td>
                    <Count n={r.persisting} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </section>

      <section aria-labelledby="details-heading" className="space-y-4">
        <SectionHeading id="details-heading">Issue details</SectionHeading>
        <div className="space-y-4">
          {(["fixed", "new", "persisting"] as const).map((k) => (
            <details
              key={k}
              className="group rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_0_var(--ink)]"
              open={k === "new" && result.new.length > 0}
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-4 font-display text-lg font-bold [&::-webkit-details-marker]:hidden">
                <span className="flex flex-wrap items-center gap-2">
                  {BUCKETS[k].title}
                  <Pill>
                    {result.counts[k]}
                    <span className="sr-only"> {result.counts[k] === 1 ? "issue" : "issues"}</span>
                  </Pill>
                </span>
                <Chevron />
              </summary>
              <div className="px-5 pb-5">
                <IssueList issues={result[k]} />
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
