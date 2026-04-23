import { ruleEnabled } from "../config.js";
import type { Rule, Fix } from "./types.js";
import { walkElements, getAttr, renderOpenTag, elementLine } from "../parse.js";

/**
 * Full HTML documents must declare a language on the root <html> element
 * so screen readers pick the right voice/pronunciation. Missing lang also
 * breaks automatic translation in browsers.
 *
 * Only applies to full documents; fragments have no <html> root.
 */
export const htmlHasLang: Rule = (ctx) => {
  const rule = ctx.config.rules.htmlHasLang;
  if (!ruleEnabled(rule) || !ctx.doc.isFullDocument) return [];

  for (const el of walkElements(ctx.doc.root)) {
    if (el.tagName?.toLowerCase() !== "html") continue;

    const lang = getAttr(el, "lang");
    const xmlLang = getAttr(el, "xml:lang");
    const value = (lang ?? xmlLang ?? "").trim();
    if (value) return [];

    const fix = buildLangFix(el);
    return [
      {
        id: "html-has-lang",
        severity: rule.severity,
        message: "<html> is missing a lang attribute.",
        element: renderOpenTag(el),
        suggestion: 'Add lang="en" (or your document language) to the <html> tag.',
        line: elementLine(el),
        ...(fix ? { fix } : {}),
      },
    ];
  }
  return [];
};

function buildLangFix(el: import("../parse.js").Element): Fix | undefined {
  const loc = (el as unknown as { sourceCodeLocation?: { startTag?: { endOffset?: number } } })
    .sourceCodeLocation;
  const endOffset = loc?.startTag?.endOffset;
  if (endOffset === undefined) return undefined;

  // Insert ` lang="en"` just before the closing `>` (or `/>`) of the <html> tag.
  return {
    start: endOffset - 1,
    end: endOffset - 1,
    replacement: ` lang="en"`,
    description: 'Add lang="en" to <html>',
  };
}
