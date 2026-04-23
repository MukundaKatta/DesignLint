import { ruleEnabled } from "../config.js";
import type { Rule, Fix } from "./types.js";
import { walkElements, getAttr, elementLine } from "../parse.js";

/**
 * Responsive viewport meta coverage. Two failures can fire:
 *   1. Missing `<meta name="viewport" content="width=...">` entirely.
 *   2. Present, but content disables user zoom (`user-scalable=no` or
 *      `maximum-scale` <= 1). Both are WCAG 1.4.4 violations because they
 *      block users with low vision from zooming the page.
 */
export const viewportMeta: Rule = (ctx) => {
  const rule = ctx.config.rules.viewportMeta;
  if (!ruleEnabled(rule) || !ctx.doc.isFullDocument) return [];

  let viewportEl: import("../parse.js").Element | undefined;
  let headEl: import("../parse.js").Element | undefined;

  for (const el of walkElements(ctx.doc.root)) {
    const tag = el.tagName?.toLowerCase();
    if (tag === "head" && !headEl) headEl = el;
    if (tag !== "meta") continue;
    const name = getAttr(el, "name")?.toLowerCase();
    if (name === "viewport") {
      viewportEl = el;
      break;
    }
  }

  if (!viewportEl) {
    const fix = buildViewportFix(headEl);
    return [
      {
        id: "viewport-meta",
        severity: rule.severity,
        message: "Document is missing a responsive viewport meta tag.",
        element: "<head>",
        suggestion:
          'Add <meta name="viewport" content="width=device-width, initial-scale=1"> inside <head>.',
        ...(fix ? { fix } : {}),
      },
    ];
  }

  const content = getAttr(viewportEl, "content") ?? "";
  if (!/width\s*=/i.test(content)) {
    const fix = buildViewportFix(headEl);
    return [
      {
        id: "viewport-meta",
        severity: rule.severity,
        message: `<meta name="viewport"> has no width= directive (${content || "empty content"}).`,
        element: "<head>",
        suggestion:
          'Set content="width=device-width, initial-scale=1" so the page scales on mobile.',
        ...(fix ? { fix } : {}),
        line: elementLine(viewportEl),
      },
    ];
  }

  const directives = parseViewportContent(content);
  const issues = [] as ReturnType<Rule>;

  if (directives["user-scalable"] === "no" || directives["user-scalable"] === "0") {
    issues.push({
      id: "viewport-meta",
      severity: rule.severity,
      message: 'viewport has user-scalable=no, which blocks pinch-zoom (WCAG 1.4.4).',
      element: "<head>",
      suggestion: "Remove user-scalable=no so users with low vision can zoom.",
      line: elementLine(viewportEl),
    });
  }

  const maxScale = parseFloat(directives["maximum-scale"] ?? "");
  if (Number.isFinite(maxScale) && maxScale <= 1) {
    issues.push({
      id: "viewport-meta",
      severity: rule.severity,
      message: `viewport maximum-scale=${directives["maximum-scale"]} blocks zoom (WCAG 1.4.4).`,
      element: "<head>",
      suggestion: "Remove maximum-scale or set it to at least 2.",
      line: elementLine(viewportEl),
    });
  }

  return issues;
};

function parseViewportContent(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of content.split(/[;,]/)) {
    const [rawK, rawV] = pair.split("=");
    if (!rawK || rawV === undefined) continue;
    out[rawK.trim().toLowerCase()] = rawV.trim().toLowerCase();
  }
  return out;
}

function buildViewportFix(
  headEl: import("../parse.js").Element | undefined
): Fix | undefined {
  if (!headEl) return undefined;
  const loc = (headEl as unknown as { sourceCodeLocation?: { startTag?: { endOffset?: number } } })
    .sourceCodeLocation;
  const insertPos = loc?.startTag?.endOffset;
  if (insertPos === undefined) return undefined;
  const meta = `\n    <meta name="viewport" content="width=device-width, initial-scale=1">`;
  return {
    start: insertPos,
    end: insertPos,
    replacement: meta,
    description: "Insert responsive viewport meta tag in <head>",
  };
}
