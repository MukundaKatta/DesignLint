import { ruleEnabled } from "../config.js";
import type { Rule } from "./types.js";
import { walkElements, getAttr, renderOpenTag, elementLine } from "../parse.js";

export const duplicateId: Rule = (ctx) => {
  const rule = ctx.config.rules.duplicateId;
  if (!ruleEnabled(rule)) return [];

  const seen = new Map<string, number>();
  const issues = [] as ReturnType<Rule>;

  for (const el of walkElements(ctx.doc.root)) {
    const id = getAttr(el, "id");
    if (!id) continue;
    const count = (seen.get(id) ?? 0) + 1;
    seen.set(id, count);

    if (count > 1) {
      issues.push({
        id: "duplicate-id",
        severity: rule.severity,
        message: `Duplicate id="${id}" (seen ${count} times). IDs must be unique per document.`,
        element: renderOpenTag(el),
        suggestion: "Rename this element's id or switch to a class selector.",
        line: elementLine(el),
      });
    }
  }
  return issues;
};
