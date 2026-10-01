export type CompareIssue = {
  ruleId: string;
  impact: string | null;
  selector: string;
  help: string;
  helpUrl: string;
};

export type RuleDelta = {
  ruleId: string;
  help: string;
  helpUrl: string;
  impact: string | null;
  fixed: number;
  new: number;
  persisting: number;
};

export type CompareResult<T extends CompareIssue = CompareIssue> = {
  fixed: T[];
  new: T[];
  persisting: T[];
  counts: {
    fixed: number;
    new: number;
    persisting: number;
    baseTotal: number;
    targetTotal: number;
  };
  byRule: RuleDelta[];
};

const keyOf = (i: CompareIssue) => `${i.ruleId}::${i.selector}`;

const IMPACT_RANK: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };
const rank = (impact: string | null) => IMPACT_RANK[impact ?? ""] ?? 4;

/** Dedupes by key, keeping the first occurrence. */
function indexIssues<T extends CompareIssue>(list: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const i of list) {
    const k = keyOf(i);
    if (!map.has(k)) map.set(k, i);
  }
  return map;
}

/**
 * Pure diff of two issue lists, keyed by ruleId + selector.
 * fixed = in base only, new = in target only, persisting = in both
 * (persisting issues are returned as they appear in the target scan).
 */
export function compareScans<T extends CompareIssue>(base: T[], target: T[]): CompareResult<T> {
  const baseMap = indexIssues(base);
  const targetMap = indexIssues(target);

  const fixed: T[] = [];
  const added: T[] = [];
  const persisting: T[] = [];
  for (const [k, i] of baseMap) if (!targetMap.has(k)) fixed.push(i);
  for (const [k, i] of targetMap) (baseMap.has(k) ? persisting : added).push(i);

  const rules = new Map<string, RuleDelta>();
  const bump = (i: T, field: "fixed" | "new" | "persisting") => {
    let r = rules.get(i.ruleId);
    if (!r) {
      r = {
        ruleId: i.ruleId,
        help: i.help,
        helpUrl: i.helpUrl,
        impact: i.impact,
        fixed: 0,
        new: 0,
        persisting: 0,
      };
      rules.set(i.ruleId, r);
    }
    r[field] += 1;
  };
  fixed.forEach((i) => bump(i, "fixed"));
  added.forEach((i) => bump(i, "new"));
  persisting.forEach((i) => bump(i, "persisting"));

  const byRule = [...rules.values()].sort(
    (a, b) => rank(a.impact) - rank(b.impact) || a.ruleId.localeCompare(b.ruleId),
  );

  return {
    fixed,
    new: added,
    persisting,
    counts: {
      fixed: fixed.length,
      new: added.length,
      persisting: persisting.length,
      baseTotal: baseMap.size,
      targetTotal: targetMap.size,
    },
    byRule,
  };
}
