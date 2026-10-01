import { NextResponse } from "next/server";
import { z } from "zod";
import { db, sites } from "@/db";
import { recentScans } from "@/lib/queries";
import { enqueueScan } from "@/lib/scans";
import { InvalidUrlError, assertScannableUrl, normalizeUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ url: z.string().min(1) });

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const body = bodySchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json({ error: "Body must be { url: string }" }, { status: 400 });
  }
  let url: string;
  let hostname: string;
  try {
    url = normalizeUrl(body.data.url);
    hostname = (await assertScannableUrl(url)).hostname;
  } catch (e) {
    if (e instanceof InvalidUrlError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }

  const [site] = await db()
    .insert(sites)
    .values({ url, hostname })
    .onConflictDoUpdate({ target: sites.url, set: { hostname } })
    .returning({ id: sites.id });
  const { scanId } = await enqueueScan(site.id);
  return NextResponse.json({ scanId, siteId: site.id }, { status: 202 });
}

export async function GET(req: Request) {
  const raw = Number(new URL(req.url).searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(raw) ? Math.min(Math.max(Math.trunc(raw), 1), 100) : 20;
  const rows = await recentScans(limit);
  return NextResponse.json({ scans: rows });
}
