import { ruleEnabled } from "../config.js";
import type { Rule } from "./types.js";
import {
  walkElements,
  effectiveStyle,
  getAttr,
  renderOpenTag,
  elementLine,
} from "../parse.js";
import { parseCSSSize } from "../utils.js";

const INTERACTIVE_TAGS = new Set(["button", "a", "input", "select", "textarea"]);
const ROLE_BUTTONS = new Set(["button", "link", "checkbox", "radio", "switch", "tab", "menuitem"]);

export const buttonSize: Rule = (ctx) => {
  const rule = ctx.config.rules.buttonSize;
  if (!ruleEnabled(rule)) return [];

  const issues = [] as ReturnType<Rule>;

  for (const el of walkElements(ctx.doc.root)) {
    const tag = el.tagName?.toLowerCase() ?? "";
    const role = getAttr(el, "role")?.toLowerCase();
    if (!INTERACTIVE_TAGS.has(tag) && !(role && ROLE_BUTTONS.has(role))) continue;

    const styles = effectiveStyle(el, ctx.doc);
    const widthRaw = styles["width"] ?? styles["min-width"];
    const heightRaw = styles["height"] ?? styles["min-height"];

    if (widthRaw) {
      const w = parseCSSSize(widthRaw);
      if (w !== null && w < rule.minWidthPx) {
        issues.push({
          id: "button-size",
          severity: rule.severity,
          message: `Touch target width ${widthRaw} (${w.toFixed(0)}px) is below the ${rule.minWidthPx}px WCAG 2.5.5 minimum.`,
          element: renderOpenTag(el),
          suggestion: `Set min-width: ${rule.minWidthPx}px on this element.`,
          line: elementLine(el),
        });
      }
    }
    if (heightRaw) {
      const h = parseCSSSize(heightRaw);
      if (h !== null && h < rule.minHeightPx) {
        issues.push({
          id: "button-size",
          severity: rule.severity,
          message: `Touch target height ${heightRaw} (${h.toFixed(0)}px) is below the ${rule.minHeightPx}px WCAG 2.5.5 minimum.`,
          element: renderOpenTag(el),
          suggestion: `Set min-height: ${rule.minHeightPx}px on this element.`,
          line: elementLine(el),
        });
      }
    }
  }
  return issues;
};
