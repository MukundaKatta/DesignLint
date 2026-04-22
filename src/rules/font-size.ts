import { ruleEnabled } from "../config.js";
import type { Rule } from "./types.js";
import { walkElements, effectiveStyle, renderOpenTag, elementLine } from "../parse.js";
import { parseCSSSize } from "../utils.js";

export const fontSizeMinimum: Rule = (ctx) => {
  const rule = ctx.config.rules.fontSizeMinimum;
  if (!ruleEnabled(rule)) return [];

  const issues = [] as ReturnType<Rule>;
  for (const el of walkElements(ctx.doc.root)) {
    const styles = effectiveStyle(el, ctx.doc);
    const fontSize = styles["font-size"];
    if (!fontSize) continue;
    const px = parseCSSSize(fontSize);
    if (px === null || px >= rule.minPx) continue;

    issues.push({
      id: "font-size-minimum",
      severity: rule.severity,
      message: `Font size ${fontSize} (${px.toFixed(1)}px) is below the readable minimum of ${rule.minPx}px.`,
      element: renderOpenTag(el),
      suggestion: `Increase font-size to at least ${rule.minPx}px.`,
      line: elementLine(el),
    });
  }
  return issues;
};
