import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { optionalEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  let db_ok = false;
  try {
    await db().execute(sql`select 1`);
    db_ok = true;
  } catch {
    db_ok = false;
  }
  let ai = false;
  let inngest = false;
  try {
    const e = optionalEnv();
    ai = Boolean(e.ANTHROPIC_API_KEY);
    inngest = Boolean(e.INNGEST_EVENT_KEY);
  } catch {
    // invalid env: leave both false
  }
  return NextResponse.json({ ok: true, db: db_ok, ai, inngest });
}
