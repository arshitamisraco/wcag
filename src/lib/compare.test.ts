import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compareScans, type CompareIssue } from "./compare";

const mk = (ruleId: string, selector: string, impact: string | null = "serious"): CompareIssue => ({
  ruleId,
  selector,
  impact,
  help: `help ${ruleId}`,
  helpUrl: `https://example.com/${ruleId}`,
});

describe("compareScans", () => {
  const base = [mk("image-alt", "img.a"), mk("image-alt", "img.b"), mk("label", "#email", "critical")];
  const target = [mk("image-alt", "img.b"), mk("color-contrast", ".x", "minor"), mk("label", "#email", "critical")];

  it("buckets fixed, new and persisting", () => {
    const r = compareScans(base, target);
    assert.deepEqual(r.fixed.map((i) => `${i.ruleId}::${i.selector}`), ["image-alt::img.a"]);
    assert.deepEqual(r.new.map((i) => `${i.ruleId}::${i.selector}`), ["color-contrast::.x"]);
    assert.deepEqual(
      r.persisting.map((i) => `${i.ruleId}::${i.selector}`).sort(),
      ["image-alt::img.b", "label::#email"],
    );
    assert.deepEqual(r.counts, { fixed: 1, new: 1, persisting: 2, baseTotal: 3, targetTotal: 3 });
  });

  it("aggregates by rule, ordered by impact", () => {
    const r = compareScans(base, target);
    assert.deepEqual(r.byRule.map((x) => x.ruleId), ["label", "image-alt", "color-contrast"]);
    const img = r.byRule.find((x) => x.ruleId === "image-alt")!;
    assert.deepEqual([img.fixed, img.new, img.persisting], [1, 0, 1]);
    assert.equal(img.help, "help image-alt");
  });

  it("treats same rule on a different selector as different issues", () => {
    const r = compareScans([mk("a", "x")], [mk("a", "y")]);
    assert.equal(r.fixed.length, 1);
    assert.equal(r.new.length, 1);
    assert.equal(r.persisting.length, 0);
  });

  it("handles empty base", () => {
    const r = compareScans([], target);
    assert.equal(r.new.length, 3);
    assert.equal(r.fixed.length, 0);
    assert.equal(r.counts.baseTotal, 0);
  });

  it("handles empty target", () => {
    const r = compareScans(base, []);
    assert.equal(r.fixed.length, 3);
    assert.equal(r.new.length, 0);
    assert.equal(r.counts.targetTotal, 0);
  });

  it("handles both empty", () => {
    const r = compareScans([], []);
    assert.deepEqual(r.counts, { fixed: 0, new: 0, persisting: 0, baseTotal: 0, targetTotal: 0 });
    assert.deepEqual(r.byRule, []);
  });

  it("dedupes duplicate keys within a scan", () => {
    const r = compareScans([mk("a", "x"), mk("a", "x")], [mk("a", "x")]);
    assert.equal(r.counts.baseTotal, 1);
    assert.equal(r.persisting.length, 1);
  });
});
