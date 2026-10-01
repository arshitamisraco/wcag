import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPrompt, explainIssuesBatch, explanationSchema, type IssueInput } from "./ai";

const issue: IssueInput = {
  ruleId: "image-alt",
  help: "Images must have alternative text",
  helpUrl: "https://dequeuniversity.com/rules/axe/4.10/image-alt",
  wcagTags: ["wcag2a", "wcag111"],
  selector: "main > img",
  failureSummary: "Fix any of the following: Element does not have an alt attribute",
  html: '<img src="/logo.png">',
};

describe("buildPrompt", () => {
  it("includes all issue fields", () => {
    const p = buildPrompt(issue);
    for (const s of [
      "image-alt",
      issue.help,
      issue.helpUrl,
      "wcag2a, wcag111",
      "main > img",
      "Element does not have an alt attribute",
      '<img src="/logo.png">',
    ]) {
      assert.ok(p.includes(s), `missing ${s}`);
    }
  });
});

describe("explanationSchema", () => {
  it("accepts valid and rejects invalid output", () => {
    const ok = explanationSchema.safeParse({
      explanation: "e",
      fixSummary: "s",
      fixCode: '<img src="/logo.png" alt="Logo">',
    });
    assert.ok(ok.success);
    assert.ok(!explanationSchema.safeParse({ explanation: "e" }).success);
  });
});

describe("explainIssuesBatch", () => {
  it("returns per-issue errors instead of rejecting", async () => {
    const saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      const res = await explainIssuesBatch([issue, issue], { concurrency: 2 });
      assert.equal(res.length, 2);
      assert.ok(res.every((r) => !r.ok));
    } finally {
      if (saved) process.env.ANTHROPIC_API_KEY = saved;
    }
  });
});
