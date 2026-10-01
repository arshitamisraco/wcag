import { and, desc, eq, gt, inArray } from "drizzle-orm";
import { db, scans } from "@/db";
import { inngest } from "@/inngest/client";

/** A site with a queued/running scan newer than this cannot be scanned again. */
export const ACTIVE_SCAN_WINDOW_MS = 2 * 60 * 1000;

export type EnqueueResult =
  | { ok: true; scanId: string }
  | { ok: false; reason: "active_scan"; scanId: string };

/**
 * Inserts a queued scan for the site and asks Inngest to run it. If the site
 * already has a queued/running scan created in the last 2 minutes, returns that
 * scan instead (callers should answer 429 and let the client navigate to it).
 */
export async function enqueueScan(siteId: string): Promise<EnqueueResult> {
  const since = new Date(Date.now() - ACTIVE_SCAN_WINDOW_MS);
  const [active] = await db()
    .select({ id: scans.id })
    .from(scans)
    .where(
      and(
        eq(scans.siteId, siteId),
        inArray(scans.status, ["queued", "running"]),
        gt(scans.createdAt, since),
      ),
    )
    .orderBy(desc(scans.createdAt))
    .limit(1);
  if (active) return { ok: false, reason: "active_scan", scanId: active.id };

  const [scan] = await db()
    .insert(scans)
    .values({ siteId })
    .returning({ id: scans.id });
  await inngest.send({ name: "scan/requested", data: { scanId: scan.id } });
  return { ok: true, scanId: scan.id };
}

export function activeScanResponseBody(scanId: string) {
  return {
    error: "A scan for this site is already in progress.",
    scanId,
  };
}
