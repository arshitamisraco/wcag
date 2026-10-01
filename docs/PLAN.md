# AI Accessibility Auditor — Build Plan

## Decisions (confirmed with owner)
- Browser on Vercel: `playwright-core` + `@sparticuz/chromium` (full `playwright` exceeds Vercel's 250MB function limit). Local dev uses a locally installed Chromium.
- DB layer: Drizzle ORM + `@neondatabase/serverless` (Neon Postgres).
- Auth: none in v1. Shared public scan history.
- Secrets: code built against `.env.example`; owner fills keys in Vercel later.
- Package manager: pnpm. Next.js App Router + TypeScript + Tailwind.
- LLM: `@anthropic-ai/sdk`, model `claude-opus-5-5` (override via `ANTHROPIC_MODEL`), structured output via `client.messages.parse` + `zodOutputFormat`.

## Architecture
```
Browser ──POST /api/scans {url}──> Next route ──inngest.send("scan/requested")──> Inngest
   │                                    │                                           │
   │<── poll GET /api/scans/:id ────────┘                              runScan function (steps):
   │                                                                   1. mark running
   └── /scans/:id renders issues + AI explanation/fix                  2. launch chromium, inject axe-core, axe.run
                                                                       3. persist issues
                                                                       4. Claude: explain + fix per issue (grouped by rule)
                                                                       5. mark completed / failed
```

## Data model (Drizzle, `src/db/schema.ts`)
- `sites`: id (uuid), url (text, normalized), hostname, created_at
- `scans`: id, site_id FK, status (`queued|running|completed|failed`), created_at, started_at, finished_at, error, summary jsonb `{violations, passes, incomplete, inapplicable, byImpact:{critical,serious,moderate,minor}}`
- `issues`: id, scan_id FK, rule_id, impact, description, help, help_url, wcag_tags text[], selector, html, failure_summary, ai_explanation, ai_fix_code, ai_fix_summary, ai_status (`pending|done|failed|skipped`)

## Phases
1. **Simplest working version**: scaffold, schema + migrations, scanner, Inngest function, Claude explainer, POST/GET API, home page (URL form + recent scans), scan detail page with polling. Local verification: typecheck, lint, build, unit test scanner against a fixture HTML served locally.
2. **History + re-scan comparison**: site page listing scans; "Re-scan" button; compare view diffing issues between two scans (fixed / new / persisting, keyed by rule_id+selector).
3. **Eval**: `pnpm eval` — for each fixture page in `eval/fixtures`, scan, get AI fixes, apply fixes to a local copy, re-scan, record % of original violations resolved to `eval/results/*.json`.
4. **PostHog + deploy readiness**: posthog-js events (`scan_submitted`, `scan_viewed`, `rescan_clicked`, `compare_viewed`), `vercel.json` maxDuration, README deploy steps (Neon, Inngest Vercel integration, env vars).

## Conventions for implementers
- Keep everything under `src/`. API routes under `src/app/api`. Inngest under `src/inngest`. Scanner under `src/lib/scanner.ts`. AI under `src/lib/ai.ts`.
- Every module that touches a secret reads from `src/lib/env.ts` (zod-validated, lazy so build succeeds without keys).
- `next.config.ts`: `serverExternalPackages: ["@sparticuz/chromium", "playwright-core"]`.
- Never bundle `axe-core` into the page via CDN; read `axe.source` from the npm package and inject with `page.addScriptTag({ content })`.
- Cap AI calls per scan (default 30 issues, sorted critical→minor) to bound cost and function time.
