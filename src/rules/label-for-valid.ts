import { ruleEnabled } from "../config.js";
import type { Rule } from "./types.js";
import { walkElements, getAttr, renderOpenTag, elementLine } from "../parse.js";

/**
 * `<label for="id">` must point at an existing element id, and the target
 * must be a form control (input/select/textarea) — otherwise the label is
 * orphaned and users tapping it get no focus transfer. Also flags duplicate
 * labels pointing at the same id (only the first one wins per WHATWG spec,
 * so later ones are effectively dead markup).
 */
const LABELABLE = new Set(["input", "select", "textarea", "meter", "progress", "output"]);

export const labelForValid: Rule = (ctx) => {
  const rule = ctx.config.rules.labelForValid;
  if (!ruleEnabled(rule)) return [];

  // Map id -> tag name for quick lookup.
  const byId = new Map<string, string>();
  const labelUsage = new Map<string, number>();

  for (const el of walkElements(ctx.doc.root)) {
    const id = getAttr(el, "id");
    if (id) byId.set(id, el.tagName?.toLowerCase() ?? "");
  }

  const issues = [] as ReturnType<Rule>;

  for (const el of walkElements(ctx.doc.root)) {
    if (el.tagName?.toLowerCase() !== "label") continue;
    const forVal = getAttr(el, "for");
    if (!forVal) continue;

    const targetTag = byId.get(forVal);
    if (!targetTag) {
      issues.push({
        id: "label-for-valid",
        severity: rule.severity,
        message: `<label for="${forVal}"> points at an id that doesn't exist.`,
        element: renderOpenTag(el),
        suggestion: "Fix the id on the form control, or remove the orphan label.",
        line: elementLine(el),
      });
      continue;
    }

    if (!LABELABLE.has(targetTag)) {
      issues.push({
        id: "label-for-valid",
        severity: rule.severity,
        message: `<label for="${forVal}"> points at a <${targetTag}>, which isn't a labelable form control.`,
        element: renderOpenTag(el),
        suggestion: "Point for= at an <input>/<select>/<textarea> instead, or use a regular element with aria-labelledby.",
        line: elementLine(el),
      });
      continue;
    }

    const usage = (labelUsage.get(forVal) ?? 0) + 1;
    labelUsage.set(forVal, usage);
    if (usage > 1) {
      issues.push({
        id: "label-for-valid",
        severity: rule.severity,
        message: `Multiple <label> elements point at id="${forVal}"; only the first is used.`,
        element: renderOpenTag(el),
        suggestion: "Remove or re-target duplicate labels.",
        line: elementLine(el),
      });
    }
  }

  return issues;
};
