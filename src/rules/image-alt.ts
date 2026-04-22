import { ruleEnabled } from "../config.js";
import type { Rule, Fix } from "./types.js";
import {
  walkElements,
  getAttr,
  hasAttr,
  renderOpenTag,
  elementLine,
} from "../parse.js";

export const imageAltText: Rule = (ctx) => {
  const rule = ctx.config.rules.imageAltText;
  if (!ruleEnabled(rule)) return [];

  const issues = [] as ReturnType<Rule>;

  for (const el of walkElements(ctx.doc.root)) {
    if (el.tagName?.toLowerCase() !== "img") continue;

    const role = getAttr(el, "role")?.toLowerCase();
    const ariaHidden = getAttr(el, "aria-hidden")?.toLowerCase() === "true";
    // Decorative images marked explicitly are fine.
    if (role === "presentation" || role === "none" || ariaHidden) continue;

    const hasAlt = hasAttr(el, "alt");
    const altEmpty = hasAlt && (getAttr(el, "alt") ?? "").trim() === "";
    if (hasAlt && !altEmpty) continue;

    const src = getAttr(el, "src") ?? "unknown";
    const fix = buildAltFix(el, ctx.source);
    issues.push({
      id: "image-alt-text",
      severity: rule.severity,
      message: altEmpty
        ? `<img src="${src}"> has empty alt. Mark it with role="presentation" if decorative, otherwise provide meaningful alt text.`
        : `<img src="${src}"> is missing alt attribute.`,
      element: renderOpenTag(el),
      suggestion: altEmpty
        ? `Add role="presentation" if decorative, or supply descriptive alt text.`
        : `Add alt="description" or alt="" + role="presentation" if purely decorative.`,
      line: elementLine(el),
      ...(fix ? { fix } : {}),
    });
  }
  return issues;
};

/**
 * Build a fix that inserts alt="" + role="presentation" on the element so
 * the image is explicitly marked decorative. This is the safe default when a
 * linter can't infer meaningful alt text.
 */
function buildAltFix(
  el: import("../parse.js").Element,
  source: string
): Fix | undefined {
  const loc = (el as unknown as { sourceCodeLocation?: { startOffset?: number; startTag?: { endOffset?: number } } })
    .sourceCodeLocation;
  const startTagEnd = loc?.startTag?.endOffset;
  if (startTagEnd === undefined) return undefined;

  // Find '>' or '/>' immediately before startTagEnd.
  let insertAt = startTagEnd - 1;
  while (insertAt > 0 && (source[insertAt] === ">" || source[insertAt] === "/")) {
    insertAt--;
  }
  // Walk past trailing spaces.
  while (insertAt > 0 && /\s/.test(source[insertAt]!)) insertAt--;
  const insertPos = insertAt + 1;

  return {
    start: insertPos,
    end: insertPos,
    replacement: ` alt="" role="presentation"`,
    description: "Mark image as decorative (alt=\"\" role=\"presentation\")",
  };
}
