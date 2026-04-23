import { ruleEnabled } from "../config.js";
import type { Rule } from "./types.js";
import {
  walkElements,
  isTextNode,
  getAttr,
  renderOpenTag,
  elementLine,
} from "../parse.js";
import type { Element, TextNode } from "../parse.js";

/**
 * Headings that a screen reader can't announce. Catches:
 *   1. Truly empty — `<h2></h2>`, `<h2>   </h2>`.
 *   2. Visible-text-only-via-images — `<h2><img src="logo.png"></h2>` where
 *      the image has no alt. The heading exists structurally but announces
 *      nothing.
 *
 * aria-label or aria-labelledby on the heading itself counts as content.
 */
export const emptyHeading: Rule = (ctx) => {
  const rule = ctx.config.rules.emptyHeading;
  if (!ruleEnabled(rule)) return [];

  const issues = [] as ReturnType<Rule>;

  for (const el of walkElements(ctx.doc.root)) {
    const tag = el.tagName?.toLowerCase() ?? "";
    if (!/^h[1-6]$/.test(tag)) continue;

    const ariaLabel = (getAttr(el, "aria-label") ?? "").trim();
    const ariaLabelledBy = (getAttr(el, "aria-labelledby") ?? "").trim();
    if (ariaLabel || ariaLabelledBy) continue;

    if (!hasAccessibleText(el)) {
      issues.push({
        id: "empty-heading",
        severity: rule.severity,
        message: `<${tag}> is empty or contains no screen-reader-accessible text.`,
        element: renderOpenTag(el),
        suggestion: "Put descriptive text in the heading, or remove the heading tag entirely.",
        line: elementLine(el),
      });
    }
  }
  return issues;
};

/**
 * An element has accessible text if any descendant text node contains
 * non-whitespace, or any descendant <img> has non-empty alt/aria-label.
 */
function hasAccessibleText(el: Element): boolean {
  for (const child of el.childNodes ?? []) {
    if (isTextNode(child)) {
      if ((child as TextNode).value.trim().length > 0) return true;
      continue;
    }
    if (!("tagName" in child)) continue;
    const childEl = child as Element;
    const tag = childEl.tagName?.toLowerCase();
    if (tag === "img") {
      const alt = (getAttr(childEl, "alt") ?? "").trim();
      const ariaLabel = (getAttr(childEl, "aria-label") ?? "").trim();
      if (alt || ariaLabel) return true;
      continue;
    }
    if (hasAccessibleText(childEl)) return true;
  }
  return false;
}
