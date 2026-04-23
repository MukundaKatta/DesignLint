import { ruleEnabled } from "../config.js";
import type { Rule } from "./types.js";
import { walkElements, getAttr, renderOpenTag, elementLine } from "../parse.js";

/**
 * <iframe> needs a title so screen readers can announce what the embedded
 * content is. Without it, the frame is announced as just "frame" which
 * strands users who can't see it.
 *
 * aria-label / aria-labelledby are accepted as equivalents.
 */
export const iframeTitle: Rule = (ctx) => {
  const rule = ctx.config.rules.iframeTitle;
  if (!ruleEnabled(rule)) return [];

  const issues = [] as ReturnType<Rule>;

  for (const el of walkElements(ctx.doc.root)) {
    if (el.tagName?.toLowerCase() !== "iframe") continue;

    const title = (getAttr(el, "title") ?? "").trim();
    const ariaLabel = (getAttr(el, "aria-label") ?? "").trim();
    const ariaLabelledBy = (getAttr(el, "aria-labelledby") ?? "").trim();
    if (title || ariaLabel || ariaLabelledBy) continue;

    // aria-hidden="true" frames are skipped entirely by AT, so they don't
    // need a title. This is rare but spec-valid.
    if ((getAttr(el, "aria-hidden") ?? "").toLowerCase() === "true") continue;

    const src = getAttr(el, "src") ?? "inline";
    issues.push({
      id: "iframe-title",
      severity: rule.severity,
      message: `<iframe src="${src}"> is missing a title; screen readers can't announce it.`,
      element: renderOpenTag(el),
      suggestion: 'Add title="Short description of the embedded content".',
      line: elementLine(el),
    });
  }

  return issues;
};
