import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { ScanPoller } from "@/components/scan-poller";
import { Alert } from "@/components/ui/alert";
import { ImpactBadge, StatusBadge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { SectionHeading } from "@/components/ui/section-heading";
import { Stat } from "@/components/ui/stat";
import { TextLink } from "@/components/ui/text-link";
import { cn } from "@/components/ui/cn";
import { DotsRow, Squiggle, Starburst } from "@/components/doodles";
import { FadeIn } from "@/components/motion/fade-in";
import { Float } from "@/components/motion/float";
import { Pulse } from "@/components/motion/pulse";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import type { Issue } from "@/db/schema";
import { IMPACTS, formatDateTime } from "@/lib/format";
import { TrackOnMount } from "@/components/track-on-mount";
import { Delta } from "@/components/delta";
import { RescanButton } from "@/components/rescan-button";
import { getScanDetail, getSiteWithScans } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Scan results | AI Accessibility Auditor" };

/** Elements shown per rule before the rest collapse into a native <details>. */
const MAX_VISIBLE_ELEMENTS = 8;

const CODE_BLOCK =
  "overflow-x-auto rounded-xl border-2 border-ink bg-ink p-3 text-xs text-cream";

function group(issues: Issue[]) {
  const map = new Map<string, Issue[]>();
  for (const i of issues) {
    const list = map.get(i.ruleId);
    if (list) list.push(i);
    else map.set(i.ruleId, [i]);
  }
  return [...map.values()];
}

function AiBlock({ issue }: { issue: Issue }) {
  if (issue.aiStatus === "done") {
    return (
      <div className="mt-3 space-y-3 rounded-xl border-2 border-ink bg-paper p-4">
        <span className="inline-block rounded-full border-2 border-ink bg-yellow px-2 text-xs font-extrabold text-ink">
          Claude&apos;s explanation
        </span>
        <div>
          <h4 className="font-display text-base font-bold">Why it matters</h4>
          <p className="mt-1 text-ink">{issue.aiExplanation}</p>
        </div>
        <div>
          <h4 className="font-display text-base font-bold">Suggested fix</h4>
          <p className="mt-1 text-ink">{issue.aiFixSummary}</p>
        </div>
        {issue.aiFixCode ? (
          <div>
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-display text-base font-bold">Fixed HTML</h4>
              <CopyButton text={issue.aiFixCode} />
            </div>
            <pre tabIndex={0} aria-label="Corrected HTML" className={cn("mt-2", CODE_BLOCK)}>
              <code>{issue.aiFixCode}</code>
            </pre>
          </div>
        ) : null}
      </div>
    );
  }
  if (issue.aiStatus === "pending") {
    return (
      <Alert tone="neutral" className="mt-3 items-center py-2 text-sm">
        <span className="flex items-center gap-2">
          <Pulse />
          <span>AI explanation pending...</span>
        </span>
      </Alert>
    );
  }
  const text: Record<string, string> = {
    skipped: "AI explanation skipped (limit reached or AI not configured).",
    failed: "AI explanation failed for this issue.",
  };
  return (
    <Alert tone="neutral" className="mt-3 py-2 text-sm">
      <p>{text[issue.aiStatus]}</p>
    </Alert>
  );
}

function ElementItem({ issue }: { issue: Issue }) {
  return (
    <li className="rounded-xl border-2 border-ink bg-cream p-4">
      <p className="text-sm">
        <span className="font-bold">Selector:</span>{" "}
        <code className="break-all rounded bg-sand px-1 font-mono text-sm">{issue.selector}</code>
      </p>
      <pre tabIndex={0} aria-label="Offending HTML" className={cn("mt-2", CODE_BLOCK)}>
        <code>{issue.html}</code>
      </pre>
      <AiBlock issue={issue} />
    </li>
  );
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
    <div className="relative space-y-8 overflow-x-clip">
      <TrackOnMount
        event="scan_viewed"
        props={{ scan_id: scan.id, status: scan.status, violations: summary?.violations ?? 0 }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-0 hidden md:block"
      >
        <Float amplitude={6} duration={5} rotate={2}>
          <Squiggle className="h-10 w-24 text-orange" />
        </Float>
        <Float amplitude={4} duration={4} rotate={2} delay={0.6} className="ml-10 mt-1">
          <DotsRow className="h-5 w-20 text-yellow" />
        </Float>
      </div>

      <div>
        <nav aria-label="Breadcrumb">
          <TextLink href="/" className="text-sm">
            <span aria-hidden="true">←</span> Back to all scans
          </TextLink>
        </nav>
        <FadeIn className="mt-4 space-y-4 md:pr-40">
          <h1 className="break-all font-display text-3xl font-bold sm:text-4xl">{site.url}</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <StatusBadge status={scan.status} />
            <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-2">
              <div>
                <dt className="inline font-bold">Requested</dt>{" "}
                <dd className="inline">{formatDateTime(scan.createdAt)}</dd>
              </div>
              {scan.startedAt ? (
                <div>
                  <dt className="inline font-bold">Started</dt>{" "}
                  <dd className="inline">{formatDateTime(scan.startedAt)}</dd>
                </div>
              ) : null}
              {scan.finishedAt ? (
                <div>
                  <dt className="inline font-bold">Finished</dt>{" "}
                  <dd className="inline">{formatDateTime(scan.finishedAt)}</dd>
                </div>
              ) : null}
            </dl>
          </div>
          <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
            <Button href={`/sites/${site.id}`} variant="ghost">
              View site history
            </Button>
            <RescanButton siteId={site.id} label="Re-scan" />
          </div>
          {previous && summary ? (
            <Card className="flex w-fit max-w-full flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <Delta current={summary.violations} previous={previous.violations} />
              <TextLink href={`/scans/${scan.id}/compare/${previous.id}`} className="text-sm">
                Compare with previous scan
              </TextLink>
            </Card>
          ) : null}
        </FadeIn>
      </div>

      {active ? <ScanPoller scanId={scan.id} initialStatus={scan.status} /> : null}

      {scan.status === "failed" ? (
        <Alert tone="error" role="alert" title="Scan failed.">
          <p>{scan.error ?? "Unknown error."}</p>
        </Alert>
      ) : null}

      {summary ? (
        <section aria-labelledby="summary-heading" className="space-y-5">
          <SectionHeading id="summary-heading">Summary</SectionHeading>
          <FadeIn delay={0.1}>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat
                label="Violations"
                value={summary.violations}
                tone="orange"
                className="[&_dt>span]:text-ink"
              />
              <Stat label="Passes" value={summary.passes} tone="green-soft" />
              <Stat label="Needs review" value={summary.incomplete} tone="yellow" />
              <Stat label="Not applicable" value={summary.inapplicable} tone="paper" />
            </dl>
          </FadeIn>
          <h3 className="font-display text-xl font-bold">Violations by impact</h3>
          <ul className="flex flex-wrap gap-2">
            {IMPACTS.map((k) => (
              <li
                key={k}
                className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-paper py-1 pl-1 pr-3"
              >
                <ImpactBadge impact={k} />
                <span className="font-display text-lg font-bold">{summary.byImpact[k]}</span>
                <span className="sr-only">violations</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {issues.length > 0 ? (
        <section aria-labelledby="issues-heading" className="space-y-6">
          <SectionHeading
            id="issues-heading"
            eyebrow={`${issues.length} ${issues.length === 1 ? "element" : "elements"} across ${groups.length} ${groups.length === 1 ? "rule" : "rules"}`}
          >
            Issues
          </SectionHeading>
          <Stagger className="space-y-6">
            {groups.map((g) => {
              const first = g[0];
              const visible = g.slice(0, MAX_VISIBLE_ELEMENTS);
              const rest = g.slice(MAX_VISIBLE_ELEMENTS);
              return (
                <StaggerItem key={first.ruleId}>
                  <article
                    aria-labelledby={`rule-${first.ruleId}`}
                    className="relative overflow-hidden rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_0_var(--ink)]"
                  >
                    <header className="space-y-3">
                      <h3 id={`rule-${first.ruleId}`} className="font-display text-xl font-bold">
                        {first.help}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                        <ImpactBadge impact={first.impact} />
                        {first.wcagTags.map((t) => (
                          <Pill key={t}>{t}</Pill>
                        ))}
                        <TextLink external href={first.helpUrl}>
                          Learn more<span className="sr-only"> about {first.ruleId}</span>
                        </TextLink>
                        <span className="text-ink-2">
                          {g.length} {g.length === 1 ? "element" : "elements"}
                        </span>
                      </div>
                      <p className="max-w-prose text-ink-2">{first.description}</p>
                    </header>
                    <ul className="mt-5 space-y-4">
                      {visible.map((issue) => (
                        <ElementItem key={issue.id} issue={issue} />
                      ))}
                    </ul>
                    {rest.length > 0 ? (
                      <details className="group mt-4">
                        <summary
                          className={cn(
                            buttonClasses("ghost", "sm"),
                            "cursor-pointer list-none [&::-webkit-details-marker]:hidden",
                          )}
                        >
                          <span className="group-open:hidden">
                            Show {rest.length} more {rest.length === 1 ? "element" : "elements"}
                          </span>
                          <span className="hidden group-open:inline">
                            Hide {rest.length} {rest.length === 1 ? "element" : "elements"}
                          </span>
                        </summary>
                        <ul className="mt-4 space-y-4">
                          {rest.map((issue) => (
                            <ElementItem key={issue.id} issue={issue} />
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </article>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>
      ) : scan.status === "completed" ? (
        <section aria-labelledby="issues-heading" className="space-y-6">
          <SectionHeading id="issues-heading">Issues</SectionHeading>
          <EmptyState
            illustration={<Starburst className="h-24 w-24" />}
            title="No violations detected"
          >
            <p>Automated checks found no WCAG violations. Manual testing is still recommended.</p>
          </EmptyState>
        </section>
      ) : null}
    </div>
  );
}
