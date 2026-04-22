import { ruleEnabled } from "../config.js";
import type { Rule } from "./types.js";
import {
  walkElements,
  getAttr,
  effectiveStyle,
  renderOpenTag,
  elementLine,
} from "../parse.js";
import { parseCSSSize } from "../utils.js";

/**
 * Flag images that are likely too large to ship at full resolution:
 *   - No srcset / sizes and a rendered width < 50% of likely natural size
 *   - Or no loading="lazy" on below-the-fold images (heuristic: after an <h2>
 *     or later in the document body)
 *
 * This is explicitly a hint, not a rule — severity defaults to "info".
 */
export const responsiveImages: Rule = (ctx) => {
  const rule = ctx.config.rules.responsiveImages;
  if (!ruleEnabled(rule)) return [];

  const issues = [] as ReturnType<Rule>;
  let sawFirstSectionHeading = false;

  for (const el of walkElements(ctx.doc.root)) {
    const tag = el.tagName?.toLowerCase() ?? "";
    if (/^h[2-6]$/.test(tag)) sawFirstSectionHeading = true;
    if (tag !== "img") continue;

    const srcset = getAttr(el, "srcset");
    const sizes = getAttr(el, "sizes");
    const loading = getAttr(el, "loading");
    const width = getAttr(el, "width") ?? effectiveStyle(el, ctx.doc)["width"];
    const widthPx = width ? parseCSSSize(width) : null;
    const src = getAttr(el, "src") ?? "";

    if (!srcset && widthPx !== null && widthPx >= 200) {
      issues.push({
        id: "responsive-images",
        severity: rule.severity,
        message: `<img src="${src}"> has no srcset. On high-DPI or wide screens the browser has to upscale.`,
        element: renderOpenTag(el),
        suggestion: `Add srcset + sizes, or use <picture> with source media queries.`,
        line: elementLine(el),
      });
    } else if (srcset && !sizes && widthPx === null) {
      issues.push({
        id: "responsive-images",
        severity: rule.severity,
        message: `<img srcset="…"> is missing a sizes attribute; browser will assume 100vw.`,
        element: renderOpenTag(el),
        suggestion: `Add sizes="(min-width: 768px) 50vw, 100vw" (or similar) to match your layout.`,
        line: elementLine(el),
      });
    }

    if (sawFirstSectionHeading && loading !== "lazy" && loading !== "eager") {
      issues.push({
        id: "responsive-images",
        severity: rule.severity,
        message: `<img src="${src}"> below the fold has no loading="lazy".`,
        element: renderOpenTag(el),
        suggestion: `Add loading="lazy" so browsers can defer offscreen image downloads.`,
        line: elementLine(el),
      });
    }
  }
  return issues;
};
