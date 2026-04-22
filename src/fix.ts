/**
 * Autofix engine. Applies non-overlapping fixes from lint issues to the
 * original source, returning the transformed HTML plus the count applied.
 */

import type { LintIssue, Fix } from "./rules/types.js";

export interface ApplyResult {
  output: string;
  appliedCount: number;
  skipped: LintIssue[];
}

/**
 * Apply as many fixes as possible without overlaps. When two fixes target the
 * same byte range, the first one wins (caller order). Fixes are applied from
 * the end of the source to the start so earlier offsets remain valid.
 */
export function applyFixes(source: string, issues: LintIssue[]): ApplyResult {
  const fixable = issues.filter((i): i is LintIssue & { fix: Fix } => !!i.fix);
  const sorted = [...fixable].sort((a, b) => b.fix.start - a.fix.start);

  const takenRanges: Array<[number, number]> = [];
  const applied: LintIssue[] = [];
  const skipped: LintIssue[] = [];
  let output = source;

  for (const issue of sorted) {
    const { start, end, replacement } = issue.fix;
    if (rangesOverlap(takenRanges, start, end)) {
      skipped.push(issue);
      continue;
    }
    output = output.slice(0, start) + replacement + output.slice(end);
    takenRanges.push([start, end]);
    applied.push(issue);
  }

  return { output, appliedCount: applied.length, skipped };
}

function rangesOverlap(
  taken: Array<[number, number]>,
  start: number,
  end: number
): boolean {
  for (const [s, e] of taken) {
    if (start < e && end > s) return true;
  }
  return false;
}
