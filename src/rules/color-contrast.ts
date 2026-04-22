import { ruleEnabled } from "../config.js";
import type { Rule } from "./types.js";
import { walkElements, effectiveStyle, renderOpenTag, elementLine } from "../parse.js";
import { parseColor, contrastRatio, parseCSSSize } from "../utils.js";

export const colorContrast: Rule = (ctx) => {
  const rule = ctx.config.rules.colorContrast;
  if (!ruleEnabled(rule)) return [];

  const issues = [] as ReturnType<Rule>;

  for (const el of walkElements(ctx.doc.root)) {
    const styles = effectiveStyle(el, ctx.doc);
    const fg = styles["color"];
    const bg = styles["background-color"] ?? styles["background"];
    if (!fg || !bg) continue;

    const fgRgb = parseColor(fg);
    const bgRgb = parseColor(bg);
    if (!fgRgb || !bgRgb) continue;

    // Skip when background is fully transparent, we can't say what it'll sit on.
    if ((bgRgb.a ?? 1) === 0) continue;

    const ratio = contrastRatio(fgRgb, bgRgb);
    const isLargeText = detectLargeText(styles);
    const minRatio = isLargeText ? rule.minRatioLarge : rule.minRatio;

    if (ratio < minRatio) {
      issues.push({
        id: "color-contrast",
        severity: rule.severity,
        message: `Contrast ratio ${ratio.toFixed(2)}:1 is below WCAG AA minimum of ${minRatio}:1${isLargeText ? " for large text" : ""}.`,
        element: renderOpenTag(el),
        suggestion: `Darken the foreground (${fg}) or lighten the background (${bg}) until ratio is at least ${minRatio}:1.`,
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
