import { ruleEnabled } from "../config.js";
import type { Rule, Fix } from "./types.js";
import { walkElements, getAttr, renderOpenTag, elementLine } from "../parse.js";
import type { Element } from "../parse.js";

/**
 * `<button>` inside a `<form>` defaults to `type="submit"`, which is a
 * classic footgun: authors write `<button onclick="doThing()">` expecting a
 * JS handler to fire, and the button also submits the form (full page
 * reload). Flag any button inside a form that doesn't set type explicitly.
 *
 * Autofix inserts `type="button"`, the safe default for non-submit actions.
 * Authors who actually want submit should add `type="submit"` to silence.
 */
export const buttonType: Rule = (ctx) => {
  const rule = ctx.config.rules.buttonType;
  if (!ruleEnabled(rule)) return [];

  const issues = [] as ReturnType<Rule>;

  for (const el of walkElements(ctx.doc.root)) {
    if (el.tagName?.toLowerCase() !== "button") continue;
    if (getAttr(el, "type")) continue;
    if (!isInsideForm(el)) continue;

    const fix = buildTypeFix(el);
    issues.push({
      id: "button-type",
      severity: rule.severity,
      message: "<button> inside <form> has no type= attribute; defaults to submit.",
      element: renderOpenTag(el),
      suggestion: 'Add type="button" (or type="submit" if submission is intended).',
      line: elementLine(el),
      ...(fix ? { fix } : {}),
    });
  }
  return issues;
};

function isInsideForm(el: Element): boolean {
  let node: Element | undefined = el;
  while (node) {
    const parent = (node as unknown as { parentNode?: unknown }).parentNode as
      | Element
      | undefined;
    if (!parent || !("tagName" in parent)) return false;
    if (parent.tagName?.toLowerCase() === "form") return true;
    node = parent;
  }
  return false;
}

function buildTypeFix(el: Element): Fix | undefined {
  const loc = (el as unknown as { sourceCodeLocation?: { startTag?: { endOffset?: number } } })
    .sourceCodeLocation;
  const endOffset = loc?.startTag?.endOffset;
  if (endOffset === undefined) return undefined;
  return {
    start: endOffset - 1,
    end: endOffset - 1,
    replacement: ` type="button"`,
    description: 'Add type="button" to prevent accidental form submit',
  };
}
