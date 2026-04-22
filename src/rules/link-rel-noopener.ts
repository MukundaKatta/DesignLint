import { ruleEnabled } from "../config.js";
import type { Rule, Fix } from "./types.js";
import { walkElements, getAttr, renderOpenTag, elementLine } from "../parse.js";

/**
 * When a link opens in a new window, browsers grant the new window a reference
 * to the opener via window.opener unless rel="noopener" is set. This is both a
 * security issue (tabnabbing) and a performance hit (main thread coupling).
 */
export const linkRelNoopener: Rule = (ctx) => {
  const rule = ctx.config.rules.linkRelNoopener;
  if (!ruleEnabled(rule)) return [];

  const issues = [] as ReturnType<Rule>;

  for (const el of walkElements(ctx.doc.root)) {
    if (el.tagName?.toLowerCase() !== "a") continue;
    const target = getAttr(el, "target");
    if (target !== "_blank") continue;

    const relRaw = getAttr(el, "rel") ?? "";
    const rel = new Set(relRaw.split(/\s+/).filter(Boolean).map((s) => s.toLowerCase()));
    if (rel.has("noopener") || rel.has("noreferrer")) continue;

    const href = getAttr(el, "href") ?? "";
    const fix = buildRelFix(el, ctx.source, relRaw);
    issues.push({
      id: "link-rel-noopener",
      severity: rule.severity,
      message: `<a href="${href}" target="_blank"> is missing rel="noopener" (tabnabbing / performance risk).`,
      element: renderOpenTag(el),
      suggestion: `Add rel="noopener noreferrer" on any target="_blank" link.`,
      line: elementLine(el),
      ...(fix ? { fix } : {}),
    });
  }
  return issues;
};

function buildRelFix(
  el: import("../parse.js").Element,
  source: string,
  relRaw: string
): Fix | undefined {
  const loc = (el as unknown as { sourceCodeLocation?: { startTag?: { attrs?: Record<string, { startOffset: number; endOffset: number }>; endOffset?: number } } })
    .sourceCodeLocation;
  if (!loc?.startTag) return undefined;

  const relLoc = loc.startTag.attrs?.rel;
  if (relLoc) {
    const newRel = relRaw.trim() ? `${relRaw.trim()} noopener noreferrer` : "noopener noreferrer";
    // Replace the whole rel="…" attribute.
    return {
      start: relLoc.startOffset,
      end: relLoc.endOffset,
      replacement: `rel="${newRel}"`,
      description: "Add noopener noreferrer to rel attribute",
    };
  }

  // No rel attribute at all: insert one before '>'.
  const endOffset = loc.startTag.endOffset;
  if (endOffset === undefined) return undefined;

  let insertAt = endOffset - 1;
  while (insertAt > 0 && (source[insertAt] === ">" || source[insertAt] === "/")) insertAt--;
  while (insertAt > 0 && /\s/.test(source[insertAt]!)) insertAt--;
  const insertPos = insertAt + 1;
  return {
    start: insertPos,
    end: insertPos,
    replacement: ` rel="noopener noreferrer"`,
    description: "Add rel=\"noopener noreferrer\" to target=\"_blank\" link",
  };
}
