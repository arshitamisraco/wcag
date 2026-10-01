import { NextResponse } from "next/server";
import { getSiteWithScans } from "@/lib/queries";
import { activeScanResponseBody, enqueueScan } from "@/lib/scans";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const found = await getSiteWithScans(id);
  if (!found) return NextResponse.json({ error: "Site not found" }, { status: 404 });
  const result = await enqueueScan(found.site.id);
  if (!result.ok) {
    return NextResponse.json(activeScanResponseBody(result.scanId), { status: 429 });
  }
  return NextResponse.json({ scanId: result.scanId }, { status: 202 });
}
