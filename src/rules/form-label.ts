import { ruleEnabled } from "../config.js";
import type { Rule } from "./types.js";
import { walkElements, getAttr, renderOpenTag, elementLine } from "../parse.js";

const LABELABLE = new Set(["input", "select", "textarea"]);
const SKIPPED_INPUT_TYPES = new Set(["hidden", "submit", "reset", "button", "image"]);

/**
 * Every form control must be associated with a label. This rule checks for
 * any of:
 *   1. <label for="id"> pointing at the control
 *   2. The control wrapped inside a <label>
 *   3. aria-label or aria-labelledby on the control
 *   4. A title attribute (weak but accepted by WCAG as fallback)
 */
export const formLabel: Rule = (ctx) => {
  const rule = ctx.config.rules.formLabel;
  if (!ruleEnabled(rule)) return [];

  const forTargets = new Set<string>();
  const wrappingLabels = new Set<import("../parse.js").Element>();

  for (const el of walkElements(ctx.doc.root)) {
    if (el.tagName?.toLowerCase() !== "label") continue;
    const forVal = getAttr(el, "for");
    if (forVal) forTargets.add(forVal);

    for (const child of walkElements(el)) {
      if (LABELABLE.has(child.tagName?.toLowerCase() ?? "")) wrappingLabels.add(child);
    }
  }

  const issues = [] as ReturnType<Rule>;
  for (const el of walkElements(ctx.doc.root)) {
    const tag = el.tagName?.toLowerCase() ?? "";
    if (!LABELABLE.has(tag)) continue;

    if (tag === "input") {
      const type = (getAttr(el, "type") ?? "text").toLowerCase();
      if (SKIPPED_INPUT_TYPES.has(type)) continue;
    }

    const id = getAttr(el, "id");
    const hasForLabel = id ? forTargets.has(id) : false;
    const isWrapped = wrappingLabels.has(el);
    const aria =
      getAttr(el, "aria-label") ||
      getAttr(el, "aria-labelledby") ||
      getAttr(el, "title");

    if (hasForLabel || isWrapped || aria) continue;

    issues.push({
      id: "form-label",
      severity: rule.severity,
      message: `<${tag}> has no associated label. Screen readers can't announce its purpose.`,
      element: renderOpenTag(el),
      suggestion: id
        ? `Add <label for="${id}">…</label> or aria-label="…" to this control.`
        : `Give this control an id and add <label for="that-id">…</label>, or set aria-label.`,
      line: elementLine(el),
    });
  }
  return issues;
};
