import { db, scans } from "@/db";
import { inngest } from "@/inngest/client";

/** Inserts a queued scan for the site and asks Inngest to run it. */
export async function enqueueScan(siteId: string): Promise<{ scanId: string }> {
  const [scan] = await db()
    .insert(scans)
    .values({ siteId })
    .returning({ id: scans.id });
  await inngest.send({ name: "scan/requested", data: { scanId: scan.id } });
  return { scanId: scan.id };
}
