# AI Accessibility Auditor

Enter a URL, and the app scans the page with [axe-core](https://github.com/dequelabs/axe-core) in headless Chromium, stores each WCAG violation, and asks Claude to explain every issue in plain language and produce corrected HTML. Scan history is public (no auth in v1).

Stack: Next.js (App Router) + TypeScript + Tailwind, Drizzle ORM on Neon Postgres, Inngest for background scan jobs, `playwright-core` + `@sparticuz/chromium`, `@anthropic-ai/sdk`.

See `docs/PLAN.md` for the architecture and phases.

## Local setup

1. `pnpm install`
2. Create a Neon Postgres database and copy `.env.example` to `.env.local`. Fill in `DATABASE_URL` and `ANTHROPIC_API_KEY`.
3. `pnpm db:push` (or `pnpm db:migrate` to apply the SQL in `drizzle/`). `drizzle-kit` reads `DATABASE_URL` from the environment: `export $(grep -v '^#' .env.local | xargs)` first, or prefix the command.
4. Make a Chromium available locally: set `CHROMIUM_EXECUTABLE_PATH` to a Chrome/Chromium binary (for example `npx playwright install chromium` and point to it). If unset, `/opt/pw-browsers/chromium` is used when present.
5. In one terminal: `pnpm dev`
6. In another: `npx inngest-cli@latest dev -u http://localhost:3000/api/inngest`
7. Open http://localhost:3000.

Without `ANTHROPIC_API_KEY`, scans still complete; issues are marked "skipped" for AI.

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | | Neon Postgres connection string |
| `ANTHROPIC_API_KEY` | for AI | | Claude API key |
| `ANTHROPIC_MODEL` | no | `claude-opus-5-5` | Model for explanations |
| `MAX_AI_ISSUES` | no | `30` | Max issues per scan sent to Claude (most severe first) |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | prod | | Set by the Inngest Vercel integration; optional in dev |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | no | host `https://us.i.posthog.com` | Analytics (Phase 4) |
| `CHROMIUM_EXECUTABLE_PATH` | no | | Local Chromium override |
| `ALLOW_PRIVATE_URLS` | no | | `1` allows scanning localhost/private IPs (tests, eval fixtures only) |

Env is validated lazily by `src/lib/env.ts`, so `next build` works without secrets.

## Scripts

`pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test` (Node test runner via tsx; the scanner test launches Chromium and is skipped if the binary is missing), `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`.

## Deploy to Vercel

1. Create a Neon database and add `DATABASE_URL`, `ANTHROPIC_API_KEY` (and optional vars) to the Vercel project.
2. Run the migration against Neon (`pnpm db:migrate` with `DATABASE_URL` set).
3. Install the Inngest Vercel integration; it sets `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` and syncs `/api/inngest`.
4. Deploy.

### Playwright on Vercel

Full `playwright` exceeds Vercel's 250MB function limit, so the app uses `playwright-core` with `@sparticuz/chromium`, which ships a compressed Chromium for serverless. Both are listed in `serverExternalPackages` in `next.config.ts`. The scanner picks this path automatically when `VERCEL` is set.

`vercel.json` sets `maxDuration: 300` for `/api/inngest` (requires Fluid compute / Pro). On Hobby plans lower it to `60`, and consider reducing `MAX_AI_ISSUES`.
