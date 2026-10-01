# Fix-quality eval

`pnpm eval` measures how often the AI-suggested fixes actually resolve the violations axe-core reports.

For each page in `eval/fixtures/*.html` it:

1. serves the fixture from a local HTTP server and scans it with the production scanner (`scanUrl`);
2. asks the model for a fix for every violating node (`explainIssuesBatch`, concurrency 4);
3. applies the fixes to a copy of the HTML (`src/lib/apply-fix.ts`);
4. re-scans the fixed copy and compares the results.

## Running

```bash
ANTHROPIC_API_KEY=... pnpm eval                 # all fixtures
pnpm eval --fixture signup                      # one fixture
pnpm eval --max-issues 20                       # cap AI calls per fixture (default 50)
pnpm eval --dry-run                             # no AI call, no fixes applied; resolved must be 0
```

`--dry-run` verifies the harness end to end (Chromium, server, scans) without an API key. It does not append to `history.csv`.
Set `ANTHROPIC_MODEL` to override the model (default `claude-opus-5-5`). Chromium is taken from `CHROMIUM_EXECUTABLE_PATH`, falling back to `/opt/pw-browsers/chromium`.

Output: a Markdown table on stdout, full detail in `eval/results/<timestamp>.json` (git-ignored; every issue, the fix, whether it applied or why not, whether it resolved), and one summary row appended to `eval/results/history.csv` (tracked) so progress over prompt/model changes is visible in git.

## Metrics

- **resolvedPct** (strict): baseline issues are keyed `ruleId::selector`. An issue is resolved if its key is absent from the re-scan. `resolvedPct = resolved / baselineViolations` (violating nodes).
- **ruleResolvedPct** (lenient): per rule, `max(0, baselineCount - rescanCount)` summed over rules, divided by baseline. This does not depend on selectors, so a fix that changes an element's tag, id or position is not counted as "still broken".
- `introduced`: keys in the re-scan that were not in the baseline. This includes selector drift, so treat it as an upper bound on regressions.

Why both: the strict metric under-counts when a fix rewrites the element so its selector changes (the old key disappears, a new one appears, and the new one is not matched). The lenient metric over-counts when a fix resolves one node of a rule but breaks another of the same rule. Read them as a lower and an upper estimate.

## Limitations

- Selector drift, as above. Selectors that cross iframes (axe frame selectors) are not supported by the applier and are recorded as failures.
- Some fixes need page-wide context that the model does not see (heading order, `region`, `landmark-one-main`, `page-has-heading-one`, duplicate structure). The model only receives the offending element, so these rules are expected to score low.
- `html` / `head` / `body` targets merge attributes only; a `<title>` fix upserts the title. Fixes that need to add elements elsewhere cannot be applied.
- Fixes are applied in document order; a fix whose element sits inside an element already replaced by another fix is recorded as failed.
- LLM nondeterminism: results vary run to run. Compare `history.csv` trends, not single runs.
- Fixtures are small and synthetic; scores are indicative, not a benchmark of real-world pages. Rules axe has deprecated (e.g. `duplicate-id`) are not reported and so are not measured.

## Adding a fixture

Drop a self-contained `eval/fixtures/<name>.html` (inline CSS, no external requests, data: URIs for images). Run `pnpm eval --dry-run --fixture <name>` and check the baseline lists the violations you intended. Aim for 4-10 violations across several rules, mixing single- and multi-violation elements.
