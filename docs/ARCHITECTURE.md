# Architecture

## Overview

DesignLint is a modular UI/UX and accessibility linter for HTML/CSS. It parses HTML with parse5 and CSS with css-tree, walks the DOM once, and lets each rule emit `LintIssue` objects with optional `Fix` offsets. The collected issues drive scoring and output formatting.

## Module Layout

```
src/
  index.ts            - Public API re-exports
  core.ts             - DesignLinter orchestrator + scoring
  config.ts           - DesignLintConfig types, defaults, mergeConfig
  parse.ts            - parse5/css-tree wrapper: effectiveStyle, walkers
  utils.ts            - Color parsing (hex/rgb/hsl/named), WCAG luminance, CSS sizes
  fix.ts              - applyFixes() non-overlap merge engine
  cli.ts              - Commander-based CLI entrypoint
  formatters/
    text.ts           - Human-readable (TTY-coloured)
    json.ts           - Machine-readable
    sarif.ts          - SARIF 2.1.0 for GitHub Code Scanning
    github.ts         - ::error/::warning/::notice workflow commands
  rules/
    index.ts          - ALL_RULES registry
    types.ts          - LintIssue / Fix / Rule / RuleContext
    color-contrast.ts
    font-size.ts
    spacing.ts
    button-size.ts
    heading-hierarchy.ts
    image-alt.ts
    viewport-meta.ts
    link-rel-noopener.ts
    form-label.ts
    duplicate-id.ts
    responsive-images.ts
```

## Pipeline

1. **Parse**. `parseHtml(source)` returns a `ParsedDoc` with a parse5 tree (with source-code location info), plus a flat list of `<style>` block rules extracted via css-tree.
2. **Resolve effective style**. For any element, `effectiveStyle(el, doc)` merges declarations from all matching `<style>` selectors with the element's inline `style="..."` (inline wins). Supports tag, `#id`, `.class`, and combinations.
3. **Run rules**. Each rule receives a `RuleContext { doc, source, config }`. Rules walk elements depth-first via `walkElements`, emit issues, and attach optional `fix` objects with byte offsets.
4. **Score**. Errors deduct 12, warnings 5, info 1, clamped to [0, 100].
5. **Format / emit**. Formatters turn the issue list into text, JSON, SARIF, or GitHub workflow commands. Fixes are applied end-to-start to preserve earlier offsets.

## Why parse5 + css-tree

- **parse5** is the spec-compliant HTML5 parser used by jsdom, Angular, and most serious tooling. It gives us accurate tag boundaries and source-code offsets, which makes autofixes safe.
- **css-tree** is the same tokenizer powering CSSTree/Recompose. It correctly handles block CSS, at-rules, declaration lists, and the weirdness of CSS values.

Regex-based HTML linting breaks on the first nested quote or comment. Using real parsers is why `target="_blank"` detection still works when a `style` attribute contains `>`.

## Adding a Rule

See [CONTRIBUTING.md](../CONTRIBUTING.md).
