import { ruleEnabled } from "../config.js";
import type { Rule } from "./types.js";
import { walkElements, effectiveStyle, renderOpenTag, elementLine } from "../parse.js";
import { parseCSSSize } from "../utils.js";

const SPACING_PROPS = [
  "margin",
  "padding",
  "gap",
  "row-gap",
  "column-gap",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
];

export const spacingConsistency: Rule = (ctx) => {
  const rule = ctx.config.rules.spacingConsistency;
  if (!ruleEnabled(rule)) return [];

  const issues = [] as ReturnType<Rule>;

  for (const el of walkElements(ctx.doc.root)) {
    const styles = effectiveStyle(el, ctx.doc);
    for (const prop of SPACING_PROPS) {
      const val = styles[prop];
      if (!val) continue;
      const tokens = val.split(/\s+/);
      for (const token of tokens) {
        if (token === "auto" || token === "0") continue;
        const px = parseCSSSize(token);
        if (px === null || px === 0) continue;
        if (Math.abs(px) % rule.baseUnit !== 0) {
          const snap = Math.round(px / rule.baseUnit) * rule.baseUnit;
          issues.push({
            id: "spacing-consistency",
            severity: rule.severity,
            message: `Spacing value ${token} is not a multiple of the ${rule.baseUnit}px base unit.`,
            element: renderOpenTag(el),
            suggestion: `Use ${snap}px instead of ${token} for a consistent spacing grid.`,
            line: elementLine(el),
          });
        }
      }
    }
  }
  return issues;
};
