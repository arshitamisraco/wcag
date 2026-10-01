import { ScanForm } from "@/components/scan-form";
import { Confetti, Squiggle, Starburst, Zigzag, HeroIllustration } from "@/components/doodles";
import { FadeIn, Float, Stagger, StaggerItem } from "@/components/motion";
import {
  Alert,
  Card,
  CardLabel,
  CardTitle,
  DataTable,
  EmptyState,
  SectionHeading,
  StatusBadge,
  TextLink,
  Td,
  Th,
  Tr,
} from "@/components/ui";
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

const STEPS = [
  {
    tone: "sky",
    title: "Scan with axe-core",
    text: "Paste a page URL and we run axe-core against WCAG 2.2.",
  },
  {
    tone: "yellow",
    title: "Claude explains it",
    text: "Every issue is explained in plain language, with who it affects.",
  },
  {
    tone: "pink",
    title: "Copy the fix",
    text: "Grab the corrected HTML and paste it straight into your code.",
  },
] as const;

export default async function Home() {
  const { scans, error } = await loadRecent();
  return (
    <div className="space-y-16">
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-x-clip pb-14 pt-10 lg:pb-12"
      >
        {/* Decorative doodles: margins and corners only, never over text. */}
        <div className="pointer-events-none absolute left-0 top-0">
          <Float amplitude={4} duration={3.6} rotate={2}>
            <Squiggle className="h-8 w-16 text-orange" />
          </Float>
        </div>
        <div className="pointer-events-none absolute -bottom-2 left-0 hidden sm:block">
          <Float amplitude={5} duration={5} rotate={5} delay={0.6}>
            <Confetti className="h-16 w-28" />
          </Float>
        </div>
        <div className="pointer-events-none absolute bottom-0 right-4 hidden sm:block lg:right-1/3">
          <Float amplitude={4} duration={4.2} rotate={3} delay={0.4}>
            <Zigzag className="h-8 w-24 text-sky-deep" />
          </Float>
        </div>

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
          <FadeIn>
            <h1
              id="hero-heading"
              className="font-display text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl"
            >
              Find accessibility issues. Get the{" "}
              <span className="whitespace-nowrap">
                <span className="relative inline-block rounded-md border-2 border-ink bg-yellow px-2 text-ink">
                  fix
                </span>
                .
              </span>
            </h1>
            <p className="mt-5 max-w-prose text-lg text-ink-2 sm:text-xl">
              Enter a page URL. We scan it with axe-core against WCAG, then Claude explains each
              issue in plain language and writes the corrected HTML.
            </p>
            <div className="mt-6">
              <ScanForm />
            </div>
          </FadeIn>
          <FadeIn delay={0.15} className="relative w-full justify-self-center lg:justify-self-end">
            <HeroIllustration className="relative w-full max-w-xl" />
          </FadeIn>
        </div>
      </section>

      <section aria-labelledby="how-heading" className="space-y-6">
        <SectionHeading id="how-heading" eyebrow="Three quick steps">
          How it works
        </SectionHeading>
        <Stagger as="ol" className="grid gap-5 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <StaggerItem as="li" key={step.title}>
              <Card tone={step.tone} className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <CardLabel className="text-ink">Step {i + 1}</CardLabel>
                  <span
                    aria-hidden="true"
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper font-display text-4xl text-ink"
                  >
                    {i + 1}
                  </span>
                </div>
                <CardTitle className="mt-3">{step.title}</CardTitle>
                <p className="mt-1 text-ink">{step.text}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section aria-labelledby="recent-heading" className="space-y-6">
        <SectionHeading id="recent-heading" eyebrow="Latest activity">
          Recent scans
        </SectionHeading>
        {error ? (
          <Alert tone="neutral" role="status">
            {error}
          </Alert>
        ) : scans.length === 0 ? (
          <EmptyState
            illustration={<Starburst className="h-24 w-24" />}
            title="No scans yet"
            action={<TextLink href="#url">Run your first scan above</TextLink>}
          >
            Your most recent scans will show up here.
          </EmptyState>
        ) : (
          <FadeIn>
            <DataTable caption="Most recent accessibility scans" label="Recent scans table" className="relative">
              <thead>
                <tr>
                  <Th>URL</Th>
                  <Th>Status</Th>
                  <Th>Violations</Th>
                  <Th>When</Th>
                </tr>
              </thead>
              <tbody>
                {scans.map((s) => (
                  <Tr key={s.id}>
                    <Td className="min-w-56">
                      <TextLink href={`/sites/${s.siteId}`} className="break-all">
                        {s.url}
                      </TextLink>
                    </Td>
                    <Td>
                      <StatusBadge status={s.status} />
                    </Td>
                    <Td>
                      {s.summary ? (
                        <span className="font-display text-lg font-bold text-ink">
                          {s.summary.violations}
                        </span>
                      ) : (
                        <span className="font-display text-lg font-bold text-ink">
                          <span aria-hidden="true">-</span>
                          <span className="sr-only">not available</span>
                        </span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-ink-2">
                      <TextLink href={`/scans/${s.id}`}>
                        {timeAgo(s.createdAt)}
                        <span className="sr-only"> (view scan)</span>
                      </TextLink>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </DataTable>
          </FadeIn>
        )}
      </section>
    </div>
  );
}
