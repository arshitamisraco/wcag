import { NextResponse } from "next/server";
import { getSiteWithScans } from "@/lib/queries";
import { enqueueScan } from "@/lib/scans";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const found = await getSiteWithScans(id);
  if (!found) return NextResponse.json({ error: "Site not found" }, { status: 404 });
  const { scanId } = await enqueueScan(found.site.id);
  return NextResponse.json({ scanId }, { status: 202 });
}
