import { ruleEnabled } from "../config.js";
import type { Rule, Fix } from "./types.js";
import { walkElements, getAttr } from "../parse.js";

export const viewportMeta: Rule = (ctx) => {
  const rule = ctx.config.rules.viewportMeta;
  if (!ruleEnabled(rule) || !ctx.doc.isFullDocument) return [];

  let hasViewport = false;
  let headEl: import("../parse.js").Element | undefined;

  for (const el of walkElements(ctx.doc.root)) {
    const tag = el.tagName?.toLowerCase();
    if (tag === "head" && !headEl) headEl = el;
    if (tag !== "meta") continue;
    const name = getAttr(el, "name")?.toLowerCase();
    const content = getAttr(el, "content") ?? "";
    if (name === "viewport" && /width\s*=/i.test(content)) {
      hasViewport = true;
      break;
    }
  }
  if (hasViewport) return [];

  const fix = buildViewportFix(headEl, ctx.source);
  return [
    {
      id: "viewport-meta",
      severity: rule.severity,
      message: "Document is missing a responsive viewport meta tag.",
      element: "<head>",
      suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> inside <head>.',
      ...(fix ? { fix } : {}),
    },
  ];
};

function buildViewportFix(
  headEl:
    | import("../parse.js").Element
    | undefined,
  source: string
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
