# AI Accessibility Auditor

Enter a URL and the app scans the page with [axe-core](https://github.com/dequelabs/axe-core) in headless Chromium, stores every WCAG violation, and asks Claude to explain each issue in plain language and produce corrected HTML. Re-scan a site over time and compare scans to see what was fixed, what is new, and what persists.

Stack: Next.js 16 (App Router) + TypeScript + Tailwind, Drizzle ORM on Neon Postgres, Inngest for background jobs, `playwright-core` + `@sparticuz/chromium`, `@anthropic-ai/sdk`, PostHog for usage analytics.

See `docs/PLAN.md` for the original build plan.

## Architecture

```
Browser --POST /api/scans {url}--> Next route --inngest.send("scan/requested")--> Inngest
   |                                  |                                              |
   |<-- poll GET /api/scans/:id ------+                                  runScan function (steps):
   |                                                                     1. mark running
   +-- /scans/:id renders issues + AI explanation/fix                    2. launch Chromium, inject axe-core, axe.run
   +-- /sites/:id history, /scans/:id/compare/:otherId                   3. persist issues (Neon Postgres)
                                                                         4. Claude: explain + fix per rule group
                                                                         5. mark completed / failed
```

## Features

- Scan any public URL against axe-core's WCAG rules.
- Plain-language explanation, fix summary, and corrected HTML per issue (capped by `MAX_AI_ISSUES`, most severe first).
- Live status polling while a scan runs.
- Per-site scan history and a re-scan button.
- Scan comparison: fixed / new / persisting issues, keyed by rule and selector.
- PostHog usage events (`scan_submitted`, `scan_viewed`, `rescan_clicked`, `compare_viewed`), disabled when no key is set.
- `GET /api/health` smoke-test endpoint.
- Duplicate-scan guard: a site with a queued or running scan created in the last 2 minutes returns HTTP 429 with the existing `scanId`, and the UI navigates to it.

## Local development

1. `pnpm install`
2. Create a Neon Postgres database. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` and `ANTHROPIC_API_KEY`.
3. `pnpm db:push` (or `pnpm db:migrate` to apply the SQL in `drizzle/`). `drizzle-kit` reads `DATABASE_URL` from the environment, so run `export $(grep -v '^#' .env.local | xargs)` first or prefix the command.
4. Make a Chromium available: set `CHROMIUM_EXECUTABLE_PATH` to a Chrome/Chromium binary (for example after `npx playwright install chromium`). If unset, `/opt/pw-browsers/chromium` is used when present. On Vercel the bundled `@sparticuz/chromium` is used instead.
5. Terminal 1: `pnpm dev`
6. Terminal 2: `npx inngest-cli@latest dev -u http://localhost:3000/api/inngest`
7. Open http://localhost:3000.

Without `ANTHROPIC_API_KEY`, scans still complete and issues are marked "skipped" for AI.

Scripts: `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`.

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | | Neon Postgres connection string |
| `ANTHROPIC_API_KEY` | for AI | | Claude API key |
| `ANTHROPIC_MODEL` | no | `claude-opus-5-5` | Model for explanations |
| `MAX_AI_ISSUES` | no | `30` | Max issues per scan sent to Claude (most severe first) |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | prod | | Set by the Inngest Vercel integration; optional in dev |
| `NEXT_PUBLIC_POSTHOG_KEY` | no | | PostHog project key. Unset disables analytics entirely |
| `NEXT_PUBLIC_POSTHOG_HOST` | no | `https://us.i.posthog.com` | PostHog ingestion host (EU: `https://eu.i.posthog.com`) |
| `CHROMIUM_EXECUTABLE_PATH` | no | | Local Chromium override |
| `ALLOW_PRIVATE_URLS` | no | | `1` allows scanning localhost/private IPs (tests and eval fixtures only, never in production) |

`NEXT_PUBLIC_*` values are inlined at build time, so redeploy after changing them. Server env is validated lazily by `src/lib/env.ts`, so `next build` works without secrets.

PostHog traffic goes through a same-origin reverse proxy (`/ingest/*`, configured in `next.config.ts`). Only hostnames, scan ids, and counts are sent, never full URLs or issue HTML.

## Deploy to Vercel

1. Create a Neon database and push this repo to GitHub.
2. In Vercel, import the repository.
3. Add environment variables: `DATABASE_URL`, `ANTHROPIC_API_KEY`, and optionally `ANTHROPIC_MODEL`, `MAX_AI_ISSUES`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`.
4. Install the [Inngest Vercel integration](https://www.inngest.com/docs/deploy/vercel) on the project. It sets `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` and syncs the app at `/api/inngest` after each deploy.
5. Enable Fluid compute (Project Settings, Functions) so the long-running scan function can use `maxDuration`. `vercel.json` sets `maxDuration: 300` for `src/app/api/inngest/route.ts`. Hobby plan limits depend on whether Fluid compute is available; you may need a value between 60 and 300, and a lower `MAX_AI_ISSUES` to fit.
6. Apply the schema to Neon once: with `DATABASE_URL` set locally, run `pnpm db:migrate` (or `pnpm db:push`).
7. Deploy, then smoke test: `curl https://<your-app>/api/health` should return `{"ok":true,"db":true,"ai":true,"inngest":true}`.

### Playwright on Vercel

Full `playwright` bundles browsers that exceed Vercel's 250MB function size limit. The app uses `playwright-core` (no browsers) plus `@sparticuz/chromium`, a compressed Chromium built for serverless Linux. Both are in `serverExternalPackages` (the sparticuz package resolves its brotli binaries relative to its own files, so it must not be bundled), and `outputFileTracingIncludes` forces `node_modules/@sparticuz/chromium/bin/**` into the `/api/inngest` function. The scanner uses this path automatically when `VERCEL` is set.

Alternatives if the in-function browser is too slow or heavy:

- A hosted browser such as Browserless or Browserbase: connect with `chromium.connectOverCDP(...)` instead of launching locally.
- A separate long-running worker (Fly.io, Railway, a container) that handles the Inngest function with a normal Playwright install, with only the Next.js app on Vercel.

## Eval

An evaluation harness measures how many violations the AI fixes resolve. See `eval/README.md`.

## Known limitations

- No authentication; scan history is public to anyone with the link and listed on the home page.
- Only the duplicate-scan guard protects `POST /api/scans`; there is no per-IP rate limiting, so a public deployment can be abused to run many scans of different URLs.
- SSRF protection resolves the hostname before scanning, but DNS rebinding between that check and the browser's own lookup is not fully mitigated.
- `byImpact` counts axe rules, not individual affected nodes, so it can be lower than the number of listed issues.
- Automated axe checks catch only a portion of WCAG issues; manual review is still required.
