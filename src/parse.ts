/**
 * HTML + CSS parsing layer.
 * Wraps parse5 and css-tree so rule files can work with typed trees
 * instead of brittle regexes.
 */

import { parse, parseFragment, defaultTreeAdapter, type DefaultTreeAdapterTypes } from "parse5";
import * as cssTree from "css-tree";

export type Document = DefaultTreeAdapterTypes.Document;
export type Element = DefaultTreeAdapterTypes.Element;
export type ChildNode = DefaultTreeAdapterTypes.ChildNode;
export type TextNode = DefaultTreeAdapterTypes.TextNode;
export type CommentNode = DefaultTreeAdapterTypes.CommentNode;
export type DocumentFragment = DefaultTreeAdapterTypes.DocumentFragment;
export interface Attribute {
  name: string;
  value: string;
  namespace?: string;
  prefix?: string;
}

export type ParsedNode = Element | Document | DocumentFragment | TextNode | CommentNode;

export interface ParsedDoc {
  root: Document | DocumentFragment;
  isFullDocument: boolean;
  /** Style rules declared in <style> blocks, keyed by the selector string. */
  styleBlocks: StyleRule[];
}

export interface StyleRule {
  selector: string;
  /** property -> value, lowercase property names. */
  declarations: Record<string, string>;
}

/**
 * Parse an HTML string. If the input starts with <html, <!doctype, or <head>
 * it is parsed as a full document; otherwise as a fragment.
 */
export function parseHtml(html: string): ParsedDoc {
  const looksLikeFullDoc = /^\s*(<!doctype|<html|<head)/i.test(html);
  const opts = { sourceCodeLocationInfo: true };
  const root = looksLikeFullDoc
    ? (parse(html, opts) as Document)
    : (parseFragment(html, opts) as DocumentFragment);
  const styleBlocks = collectStyleBlocks(root);
  return { root, isFullDocument: looksLikeFullDoc, styleBlocks };
}

/** Walk every Element in the tree, depth-first. */
export function* walkElements(
  node: Document | DocumentFragment | Element
): Generator<Element> {
  const children = (node as Document | DocumentFragment | Element).childNodes ?? [];
  for (const child of children) {
    if (isElement(child)) {
      yield child as Element;
      yield* walkElements(child as Element);
    }
  }
}

export function isElement(node: ChildNode | undefined): node is Element {
  return !!node && "tagName" in node;
}

export function isTextNode(node: ChildNode | undefined): node is TextNode {
  return !!node && "nodeName" in node && node.nodeName === "#text";
}

/** Get an attribute value, case-insensitive. Returns undefined if missing. */
export function getAttr(el: Element, name: string): string | undefined {
  const attrs = el.attrs ?? [];
  const found = attrs.find((a: Attribute) => a.name.toLowerCase() === name.toLowerCase());
  return found?.value;
}

export function hasAttr(el: Element, name: string): boolean {
  return getAttr(el, name) !== undefined;
}

/** Parse an inline style attribute into a property map (lowercased keys). */
export function parseInlineStyle(style: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!style) return out;
  try {
    const ast = cssTree.parse(style, { context: "declarationList" });
    cssTree.walk(ast, {
      visit: "Declaration",
      enter(decl) {
        const prop = decl.property.toLowerCase();
        out[prop] = cssTree.generate(decl.value).trim();
      },
    });
  } catch {
    // Fallback: simple split. Covers malformed inline styles that css-tree rejects.
    for (const pair of style.split(";")) {
      const idx = pair.indexOf(":");
      if (idx === -1) continue;
      const prop = pair.slice(0, idx).trim().toLowerCase();
      const val = pair.slice(idx + 1).trim();
      if (prop) out[prop] = val;
    }
  }
  return out;
}

/** Extract all <style>…</style> blocks into StyleRule objects. */
function collectStyleBlocks(root: Document | DocumentFragment): StyleRule[] {
  const rules: StyleRule[] = [];
  for (const el of walkElements(root)) {
    if (el.tagName?.toLowerCase() !== "style") continue;
    const text = (el.childNodes ?? [])
      .filter(isTextNode)
      .map((t: TextNode) => t.value)
      .join("\n");
    try {
      const ast = cssTree.parse(text);
      cssTree.walk(ast, {
        visit: "Rule",
        enter(node) {
          const selectors: string[] = [];
          if (node.prelude && node.prelude.type === "SelectorList") {
            cssTree.walk(node.prelude, {
              visit: "Selector",
              enter(sel) {
                selectors.push(cssTree.generate(sel).trim());
              },
            });
          }
          const declarations: Record<string, string> = {};
          cssTree.walk(node.block, {
            visit: "Declaration",
            enter(decl) {
              declarations[decl.property.toLowerCase()] = cssTree
                .generate(decl.value)
                .trim();
            },
          });
          for (const selector of selectors) {
            rules.push({ selector, declarations });
          }
        },
      });
    } catch {
      // Skip unparseable style blocks instead of failing the whole lint.
    }
  }
  return rules;
}

/**
 * Given an element, compute an effective style map by merging any matching
 * <style>-block declarations with its inline style. Inline wins.
 *
 * Selector matching is intentionally limited to what a linter actually needs:
 * tag names, IDs (#foo), classes (.bar), and compound like `tag.class`. Cascade
 * order is declaration order, which is sufficient for linting accuracy.
 */
export function effectiveStyle(
  el: Element,
  doc: ParsedDoc
): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const rule of doc.styleBlocks) {
    if (selectorMatches(el, rule.selector)) {
      Object.assign(merged, rule.declarations);
    }
  }
  Object.assign(merged, parseInlineStyle(getAttr(el, "style")));
  return merged;
}

/**
 * Very small selector matcher. Supports:
 *   - tag
 *   - .class
 *   - #id
 *   - combinations (tag.class, tag#id, .a.b)
 *   - comma-separated lists
 *
 * Descendant combinators and pseudo-classes are ignored for linting purposes.
 */
function selectorMatches(el: Element, selector: string): boolean {
  const parts = selector.split(",").map((p) => p.trim());
  const tag = el.tagName?.toLowerCase() ?? "";
  const id = getAttr(el, "id");
  const classes = (getAttr(el, "class") ?? "").split(/\s+/).filter(Boolean);

  for (const part of parts) {
    const simple = part.split(/\s|>|\+|~/).pop() ?? part;
    if (matchSimple(simple, tag, id, classes)) return true;
  }
  return false;
}

function matchSimple(
  sel: string,
  tag: string,
  id: string | undefined,
  classes: string[]
): boolean {
  if (sel === "*") return true;
  const tokens = sel.match(/(^[a-zA-Z][\w-]*)|(\.[a-zA-Z][\w-]*)|(#[a-zA-Z][\w-]*)/g);
  if (!tokens) return false;
  for (const tok of tokens) {
    if (tok.startsWith(".")) {
      if (!classes.includes(tok.slice(1))) return false;
    } else if (tok.startsWith("#")) {
      if (id !== tok.slice(1)) return false;
    } else {
      if (tag !== tok.toLowerCase()) return false;
    }
  }
  return true;
}

/**
 * Extract a readable snippet of the element's opening tag for issue messages.
 */
export function renderOpenTag(el: Element, maxLen = 80): string {
  const attrs = (el.attrs ?? [])
    .map((a: Attribute) => `${a.name}="${a.value.replace(/"/g, '&quot;')}"`)
    .join(" ");
  const tag = attrs ? `<${el.tagName} ${attrs}>` : `<${el.tagName}>`;
  return tag.length > maxLen ? tag.slice(0, maxLen - 3) + "..." : tag;
}

/** Approximate 1-based line number of an element for CLI output. */
export function elementLine(el: Element): number | undefined {
  const loc = (el as unknown as { sourceCodeLocation?: { startLine?: number } })
    .sourceCodeLocation;
  return loc?.startLine;
}

export { defaultTreeAdapter };
