import { eq, sql } from "drizzle-orm";
import { NonRetriableError } from "inngest";
import { db, issues, scans, sites } from "@/db";
import { aiConfigured, explainIssuesBatch } from "@/lib/ai";
import { IMPACT_ORDER_SQL } from "@/lib/queries";
import { optionalEnv } from "@/lib/env";
import { flattenViolations, scanUrl } from "@/lib/scanner";
import { InvalidUrlError } from "@/lib/url";
import { inngest } from "../client";



function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

async function markFailed(scanId: string, error: string) {
  await db()
    .update(scans)
    .set({ status: "failed", error: error.slice(0, 2000), finishedAt: new Date() })
    .where(eq(scans.id, scanId));
}

const RETRIES = 1;

type AttemptInfo = { attempt: number; retries: number };

/**
 * Runs a step body and rethrows failures. The scan is marked failed only when
 * the error is non-retriable or this is the final attempt, so the UI does not
 * show "failed" while Inngest is still going to retry.
 */
async function guarded<T>(
  scanId: string,
  { attempt, retries }: AttemptInfo,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const nonRetriable = e instanceof InvalidUrlError || e instanceof NonRetriableError;
    if (nonRetriable || attempt >= retries) {
      try {
        await markFailed(scanId, message(e));
      } catch {
        // ignore secondary failure; original error is what matters
      }
    }
    if (nonRetriable) throw new NonRetriableError(message(e));
    throw e;
  }
}

export const runScan = inngest.createFunction(
  {
    id: "run-scan",
    triggers: [{ event: "scan/requested" }],
    concurrency: { limit: 2 },
    retries: RETRIES,
  },
  async ({ event, step, attempt }) => {
    const info: AttemptInfo = { attempt, retries: RETRIES };
    const scanId = (event.data as { scanId: string }).scanId;

    await step.run("mark-running", () =>
      guarded(scanId, info, async () => {
        await db()
          .update(scans)
          .set({ status: "running", startedAt: new Date(), error: null })
          .where(eq(scans.id, scanId));
      }),
    );

    const scanned = await step.run("scan", () =>
      guarded(scanId, info, async () => {
        const [row] = await db()
          .select({ url: sites.url })
          .from(scans)
          .innerJoin(sites, eq(scans.siteId, sites.id))
          .where(eq(scans.id, scanId));
        if (!row) throw new NonRetriableError(`Scan ${scanId} not found`);
        const result = await scanUrl(row.url);
        return {
          issues: flattenViolations(result.violations),
          summary: result.summary,
        };
      }),
    );

    await step.run("store-issues", () =>
      guarded(scanId, info, async () => {
        await db().delete(issues).where(eq(issues.scanId, scanId));
        const rows = scanned.issues.map((i) => ({
          ...i,
          scanId,
          aiStatus: "pending" as const,
        }));
        for (let i = 0; i < rows.length; i += 200) {
          await db().insert(issues).values(rows.slice(i, i + 200));
        }
        await db()
          .update(scans)
          .set({ summary: scanned.summary })
          .where(eq(scans.id, scanId));
      }),
    );

    await step.run("explain", () =>
      guarded(scanId, info, async () => {
        if (!aiConfigured()) {
          await db()
            .update(issues)
            .set({ aiStatus: "skipped" })
            .where(eq(issues.scanId, scanId));
          return { explained: 0, skipped: true };
        }
        const limit = optionalEnv().MAX_AI_ISSUES;
        const selected = await db()
          .select()
          .from(issues)
          .where(eq(issues.scanId, scanId))
          .orderBy(IMPACT_ORDER_SQL, issues.ruleId)
          .limit(limit);

        const results = await explainIssuesBatch(selected, { concurrency: 4 });
        for (const r of results) {
          if (r.ok) {
            await db()
              .update(issues)
              .set({
                aiStatus: "done",
                aiExplanation: r.value.explanation,
                aiFixSummary: r.value.fixSummary,
                aiFixCode: r.value.fixCode,
              })
              .where(eq(issues.id, r.input.id));
          } else {
            await db()
              .update(issues)
              .set({ aiStatus: "failed" })
              .where(eq(issues.id, r.input.id));
          }
        }
        await db()
          .update(issues)
          .set({ aiStatus: "skipped" })
          .where(
            sql`${issues.scanId} = ${scanId} and ${issues.aiStatus} = 'pending'`,
          );
        return { explained: results.filter((r) => r.ok).length, skipped: false };
      }),
    );

    await step.run("mark-completed", () =>
      guarded(scanId, info, async () => {
        await db()
          .update(scans)
          .set({ status: "completed", finishedAt: new Date() })
          .where(eq(scans.id, scanId));
      }),
    );

    return { scanId };
  },
);
