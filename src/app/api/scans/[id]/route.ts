import { NextResponse } from "next/server";
import { getScanDetail } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const detail = await getScanDetail(id);
  if (!detail) return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  return NextResponse.json(detail);
}
