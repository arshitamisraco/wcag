import { NextResponse } from "next/server";
import { compareScans } from "@/lib/compare";
import { getScanHeader, getScanIssuesForCompare } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const otherId = new URL(req.url).searchParams.get("with");
  if (!otherId) {
    return NextResponse.json({ error: "Missing ?with=<scanId>" }, { status: 400 });
  }
  const [a, b] = await Promise.all([getScanHeader(id), getScanHeader(otherId)]);
  if (!a || !b) return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  if (a.siteId !== b.siteId) {
    return NextResponse.json({ error: "Scans belong to different sites" }, { status: 400 });
  }
  if (a.status !== "completed" || b.status !== "completed") {
    return NextResponse.json({ error: "Both scans must be completed" }, { status: 409 });
  }
  // Older scan is the base regardless of argument order.
  const [base, target] = a.createdAt <= b.createdAt ? [a, b] : [b, a];
  const [baseIssues, targetIssues] = await Promise.all([
    getScanIssuesForCompare(base.id),
    getScanIssuesForCompare(target.id),
  ]);
  return NextResponse.json({ base, target, ...compareScans(baseIssues, targetIssues) });
}
