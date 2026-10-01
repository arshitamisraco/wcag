import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit does not load .env.local (only Next.js does). .env.local wins; .env is a fallback.
// dotenv never overrides vars that are already set.
config({ path: ".env.local" });
config();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
