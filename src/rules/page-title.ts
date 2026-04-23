import { ruleEnabled } from "../config.js";
import type { Rule } from "./types.js";
import { walkElements, isTextNode } from "../parse.js";
import type { Element, TextNode } from "../parse.js";

/**
 * Every full HTML document needs a non-empty <title>. Browsers use it for the
 * tab label, bookmarks, and history; screen readers announce it on page load.
 * Empty <title> is a surprisingly common regression from templating mistakes.
 */
export const pageTitle: Rule = (ctx) => {
  const rule = ctx.config.rules.pageTitle;
  if (!ruleEnabled(rule) || !ctx.doc.isFullDocument) return [];

  let titleEl: Element | undefined;
  for (const el of walkElements(ctx.doc.root)) {
    if (el.tagName?.toLowerCase() === "title") {
      titleEl = el;
      break;
    }
  }

  if (!titleEl) {
    return [
      {
        id: "page-title",
        severity: rule.severity,
        message: "Document has no <title> element.",
        element: "<head>",
        suggestion: "Add <title>Your page name</title> inside <head>.",
      },
    ];
  }

  const text = (titleEl.childNodes ?? [])
    .filter(isTextNode)
    .map((t: TextNode) => t.value)
    .join("")
    .trim();
  if (text.length === 0) {
    return [
      {
        id: "page-title",
        severity: rule.severity,
        message: "<title> is empty.",
        element: "<title>",
        suggestion: "Put a meaningful page name between <title> and </title>.",
      },
    ];
  }
  return [];
};
