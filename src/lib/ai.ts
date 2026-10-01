import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { optionalEnv } from "@/lib/env";

export const explanationSchema = z.object({
  explanation: z
    .string()
    .describe("2-4 sentence plain-language explanation of the issue and who it affects"),
  fixSummary: z.string().describe("One sentence summarizing the fix"),
  fixCode: z
    .string()
    .describe(
      "Corrected HTML for the offending element only. Valid HTML, no markdown fences, no commentary.",
    ),
});

export type Explanation = z.infer<typeof explanationSchema>;

export type IssueInput = {
  ruleId: string;
  help: string;
  helpUrl: string;
  wcagTags: string[];
  selector: string;
  failureSummary: string | null;
  html: string;
};

export const SYSTEM_PROMPT = `You are a web accessibility expert. You are given a single WCAG violation found by axe-core.
- Explain the issue in plain language for a developer who is unfamiliar with accessibility, in 2-4 sentences: what is wrong, and who is affected.
- Give a one-sentence fix summary.
- Provide fixCode: the corrected HTML snippet for the offending element only. It must be valid HTML, with no markdown fences and no commentary. Keep the element's existing attributes and content unless they must change. If the fix needs a value you cannot know (e.g. alt text), use a realistic placeholder derived from context.`;

export function buildPrompt(issue: IssueInput): string {
  return [
    `Rule ID: ${issue.ruleId}`,
    `Help: ${issue.help}`,
    `Help URL: ${issue.helpUrl}`,
    `WCAG tags: ${issue.wcagTags.length ? issue.wcagTags.join(", ") : "none"}`,
    `Selector: ${issue.selector}`,
    `Failure summary: ${issue.failureSummary ?? "n/a"}`,
    `Offending HTML:`,
    issue.html,
  ].join("\n");
}

export function aiConfigured(): boolean {
  return Boolean(optionalEnv().ANTHROPIC_API_KEY);
}

export async function explainIssue(issue: IssueInput): Promise<Explanation> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: optionalEnv().ANTHROPIC_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildPrompt(issue) }],
    output_config: { format: zodOutputFormat(explanationSchema) },
  });
  if (response.stop_reason === "refusal") {
    throw new Error("Model refused to explain this issue");
  }
  if (!response.parsed_output) {
    throw new Error("Model returned no parseable output");
  }
  return response.parsed_output;
}

export type BatchResult<T> =
  | { ok: true; value: Explanation; input: T }
  | { ok: false; error: string; input: T };

export async function explainIssuesBatch<T extends IssueInput>(
  issues: T[],
  { concurrency = 4 }: { concurrency?: number } = {},
): Promise<BatchResult<T>[]> {
  const results: BatchResult<T>[] = new Array(issues.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= issues.length) return;
      const input = issues[i];
      try {
        results[i] = { ok: true, value: await explainIssue(input), input };
      } catch (e) {
        results[i] = {
          ok: false,
          error: e instanceof Error ? e.message : String(e),
          input,
        };
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(concurrency, issues.length)) }, worker),
  );
  return results;
}
