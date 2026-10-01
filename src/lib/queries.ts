import { asc, desc, eq, sql } from "drizzle-orm";
import { db, issues, scans, sites } from "@/db";

export const IMPACT_ORDER_SQL = sql`case ${issues.impact}
  when 'critical' then 0 when 'serious' then 1 when 'moderate' then 2 when 'minor' then 3 else 4 end`;

export async function recentScans(limit: number) {
  return db()
    .select({
      id: scans.id,
      siteId: scans.siteId,
      url: sites.url,
      status: scans.status,
      createdAt: scans.createdAt,
      finishedAt: scans.finishedAt,
      summary: scans.summary,
    })
    .from(scans)
    .innerJoin(sites, eq(scans.siteId, sites.id))
    .orderBy(desc(scans.createdAt))
    .limit(limit);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getScanDetail(id: string) {
  if (!UUID_RE.test(id)) return null;
  const [row] = await db()
    .select({ scan: scans, site: sites })
    .from(scans)
    .innerJoin(sites, eq(scans.siteId, sites.id))
    .where(eq(scans.id, id));
  if (!row) return null;
  const rows = await db()
    .select()
    .from(issues)
    .where(eq(issues.scanId, id))
    .orderBy(asc(IMPACT_ORDER_SQL), asc(issues.ruleId), asc(issues.selector));
  return { scan: row.scan, site: row.site, issues: rows };
}

export type ScanDetail = NonNullable<Awaited<ReturnType<typeof getScanDetail>>>;
