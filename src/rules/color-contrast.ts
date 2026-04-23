import { ruleEnabled } from "../config.js";
import type { Rule } from "./types.js";
import {
  walkElements,
  effectiveStyle,
  renderOpenTag,
  elementLine,
  resolveBackground,
  resolveColor,
} from "../parse.js";
import { parseColor, contrastRatio, parseCSSSize } from "../utils.js";

/**
 * WCAG AA contrast checker.
 *
 * Resolves both `color` and `background-color` up the ancestor chain, since
 * CSS inheritance and background painting don't stop at the element under
 * test. Without this, the rule only fires when both properties happen to be
 * set on the same element — which is rare in real stylesheets.
 *
 * If no ancestor sets a solid background, we fall back to white, matching the
 * browser default that users ultimately see.
 */
const DEFAULT_BG = "#ffffff";

export const colorContrast: Rule = (ctx) => {
  const rule = ctx.config.rules.colorContrast;
  if (!ruleEnabled(rule)) return [];

  const issues = [] as ReturnType<Rule>;

  for (const el of walkElements(ctx.doc.root)) {
    const own = effectiveStyle(el, ctx.doc);

    // Only flag elements that actually declare a foreground color. Running on
    // every element would generate noise: the rule should be about colors
    // the author chose, not defaults.
    if (!own["color"]) continue;

    const fgRaw = resolveColor(el, ctx.doc) ?? own["color"];
    const bgRaw = resolveBackground(el, ctx.doc) ?? DEFAULT_BG;

    const fgRgb = parseColor(fgRaw);
    const bgRgb = parseColor(bgRaw);
    if (!fgRgb || !bgRgb) continue;

    // Background effectively transparent all the way up — nothing to compare.
    if ((bgRgb.a ?? 1) === 0) continue;

    const ratio = contrastRatio(fgRgb, bgRgb);
    const isLargeText = detectLargeText(own);
    const minRatio = isLargeText ? rule.minRatioLarge : rule.minRatio;

    if (ratio < minRatio) {
      issues.push({
        id: "color-contrast",
        severity: rule.severity,
        message: `Contrast ratio ${ratio.toFixed(2)}:1 is below WCAG AA minimum of ${minRatio}:1${isLargeText ? " for large text" : ""}.`,
        element: renderOpenTag(el),
        suggestion: `Darken the foreground (${fgRaw}) or lighten the background (${bgRaw}) until ratio is at least ${minRatio}:1.`,
        line: elementLine(el),
      });
    }
  }
  return issues;
};

function detectLargeText(styles: Record<string, string>): boolean {
  const sizeRaw = styles["font-size"];
  const weightRaw = styles["font-weight"];
  if (!sizeRaw) return false;
  const sizePx = parseCSSSize(sizeRaw);
  if (sizePx === null) return false;
  const weightNum = weightRaw ? parseInt(weightRaw, 10) : 400;
  const isBold = Number.isFinite(weightNum) ? weightNum >= 700 : weightRaw === "bold";
  return sizePx >= 24 || (isBold && sizePx >= 18.66);
}
