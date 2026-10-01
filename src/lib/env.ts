import { z } from "zod";

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);
const opt = <T extends z.ZodType>(schema: T) =>
  z.preprocess(emptyToUndefined, schema.optional());

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ANTHROPIC_API_KEY: opt(z.string().min(1)),
  ANTHROPIC_MODEL: z.preprocess(
    emptyToUndefined,
    z.string().default("claude-opus-5-5"),
  ),
  INNGEST_EVENT_KEY: opt(z.string()),
  INNGEST_SIGNING_KEY: opt(z.string()),
  NEXT_PUBLIC_POSTHOG_KEY: opt(z.string()),
  NEXT_PUBLIC_POSTHOG_HOST: z.preprocess(
    emptyToUndefined,
    z.string().url().default("https://us.i.posthog.com"),
  ),
  CHROMIUM_EXECUTABLE_PATH: opt(z.string()),
  MAX_AI_ISSUES: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0).default(30),
  ),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Lazily parsed environment. Never call at module top level. */
export function env(): Env {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const msg = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      throw new Error(`Invalid environment: ${msg}`);
    }
    cached = parsed.data;
  }
  return cached;
}

/** Parse only the vars a caller needs without requiring DATABASE_URL etc. */
export function optionalEnv() {
  return envSchema.partial({ DATABASE_URL: true }).parse(process.env);
}
