import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/lib/env";
import * as schema from "./schema";

let instance: ReturnType<typeof create> | undefined;

function create() {
  return drizzle(neon(env().DATABASE_URL), { schema });
}

/** Lazily created Drizzle client (so builds work without DATABASE_URL). */
export function db() {
  if (!instance) instance = create();
  return instance;
}

export * from "./schema";
