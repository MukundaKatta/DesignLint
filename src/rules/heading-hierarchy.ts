import { ruleEnabled } from "../config.js";
import type { Rule } from "./types.js";
import { walkElements, renderOpenTag, elementLine } from "../parse.js";

export const headingHierarchy: Rule = (ctx) => {
  const rule = ctx.config.rules.headingHierarchy;
  if (!ruleEnabled(rule)) return [];

  const issues = [] as ReturnType<Rule>;
  let last = 0;

  for (const el of walkElements(ctx.doc.root)) {
    const tag = el.tagName?.toLowerCase() ?? "";
    if (!/^h[1-6]$/.test(tag)) continue;
    const level = parseInt(tag.slice(1), 10);

    if (last === 0 && level !== 1 && ctx.doc.isFullDocument) {
      issues.push({
        id: "heading-hierarchy",
        severity: rule.severity,
        message: `First heading is <${tag}>, expected <h1>.`,
        element: renderOpenTag(el),
        suggestion: "Start every page with an <h1> for assistive-tech navigation.",
        line: elementLine(el),
      });
    } else if (last > 0 && level > last + 1) {
      issues.push({
        id: "heading-hierarchy",
        severity: rule.severity,
        message: `Heading <${tag}> skips from <h${last}>. Headings should not skip levels.`,
        element: renderOpenTag(el),
        suggestion: `Use <h${last + 1}> instead, or promote the preceding heading.`,
        line: elementLine(el),
      });
    }
    last = level;
  }
  return issues;
};
