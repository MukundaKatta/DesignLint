# DesignLint

[![npm](https://img.shields.io/npm/v/@mukundakatta/designlint.svg)](https://www.npmjs.com/package/@mukundakatta/designlint)
[![CI](https://github.com/MukundaKatta/DesignLint/actions/workflows/ci.yml/badge.svg)](https://github.com/MukundaKatta/DesignLint/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

An accessibility and design linter for HTML/CSS. Catches low-contrast text, tiny touch targets, skipped heading levels, unlabeled form controls, missing alt text, and more — with autofixes for the mechanical ones.

Runs as a **CLI**, a **GitHub Action** (PR annotations + SARIF for Code Scanning), or a programmatic API.

```
$ designlint index.html
index.html
  line 12  error   color-contrast
    Contrast ratio 1.61:1 is below WCAG AA minimum of 4.5:1.
    in: <p style="color: #ccc; background-color: #fff">
    tip: Darken the foreground or lighten the background.
  line 18  error   image-alt-text
    <img src="hero.png"> is missing alt attribute.
    fix: Mark image as decorative (alt="" role="presentation")
  line 21  warning link-rel-noopener
    <a href="..." target="_blank"> is missing rel="noopener".
    fix: Add rel="noopener noreferrer" to target="_blank" link

  3 issues (2 errors, 1 warning). Score 79/100.
```

## Install

```bash
npm install -g @mukundakatta/designlint
```

Or one-off without installing:

```bash
npx @mukundakatta/designlint path/to/page.html
```

## Usage

### CLI

```bash
designlint '<inputs...>' [options]
```

| Flag | Description |
|---|---|
| `--format text\|json\|sarif\|github` | Output format (default `text`) |
| `--fix` | Apply autofixes in place |
| `--rule <id...>` | Run only the listed rule IDs |
| `--config <path>` | JSON config file |
| `--fail-on error\|warning\|info\|never` | Exit nonzero threshold (default `error`) |
| `--output <path>` | Write output to a file |
| `-q`, `--quiet` | Only report errors (suppress warnings and info) |
| `--list-rules` | List every rule with its default severity and summary |
| `-v`, `--version` | Print version |

When `--config` is not passed, DesignLint walks up from the current
directory looking for `.designlintrc.json` (the first one found wins). If
nothing is found, defaults are used.

Scaffold a config with every rule at its default:

```bash
designlint init                      # writes .designlintrc.json
designlint init path/to/config.json  # custom path
designlint init --force              # overwrite existing
```

**Inputs** can be file paths, globs, or URLs:

```bash
designlint index.html
designlint 'src/**/*.html'
designlint https://example.com --format sarif > results.sarif
designlint index.html --fix                       # apply autofixes
designlint index.html --rule color-contrast       # single rule
```

### GitHub Action

```yaml
# .github/workflows/designlint.yml
name: DesignLint
on: [pull_request]
permissions:
  contents: read
  pull-requests: write
  security-events: write
jobs:
  designlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: MukundaKatta/DesignLint@v0.4.0
        with:
          paths: 'src/**/*.html'
          fail-on: error
      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: designlint.sarif
```

The action:

1. Emits inline GitHub annotations on the PR diff (the `::error`/`::warning` style you see under "Files changed").
2. Writes SARIF 2.1.0 so you can upload it to **Code Scanning** and get persistent findings in the Security tab.
3. Fails the job based on `--fail-on` when issues meet the threshold.

### Programmatic

```ts
import { DesignLinter, applyFixes } from "@mukundakatta/designlint";

const linter = new DesignLinter({
  rules: {
    colorContrast: { minRatio: 4.5 },
    buttonSize: { minWidthPx: 44, minHeightPx: 44 },
    spacingConsistency: { baseUnit: 8 },
  },
});

const html = await fetch("https://example.com").then((r) => r.text());
const report = linter.lint(html);

console.log(report.summary);
console.log(report.issues);
console.log(report.score);

const { output, appliedCount } = applyFixes(html, report.issues);
```

## Rules

| ID | Checks | Severity | Autofix |
|---|---|---|---|
| `color-contrast` | WCAG AA contrast ratio (4.5:1 normal, 3:1 large text). Resolves inherited `color` and ancestor `background-color`; alpha-composes `rgba`. | error | no |
| `font-size-minimum` | Font sizes below 12px are hard to read. | warning | no |
| `spacing-consistency` | Margin/padding/gap should snap to your base unit (4 or 8). | info | no |
| `button-size` | Touch targets must be at least 44x44 (WCAG 2.5.5). | error | no |
| `heading-hierarchy` | Headings should not skip levels (`h1 -> h3`). | warning | no |
| `empty-heading` | `<hN>` must contain text (or an `<img alt>`, or `aria-label`). | warning | no |
| `image-alt-text` | `<img>` and `<input type="image">` need `alt` (or `aria-label`). Flags junk alt like `"image.png"` or `"photo"`. | error | yes (img) |
| `viewport-meta` | Responsive `<meta name="viewport">` present, with no zoom lockout (`user-scalable=no`, `maximum-scale<=1`). | warning | yes |
| `link-rel-noopener` | `target="_blank"` links need `rel="noopener"`. | warning | yes |
| `form-label` | Every `<input>`/`<select>`/`<textarea>` needs a label, aria-label, or wrapping `<label>`. | error | no |
| `label-for-valid` | `<label for=id>` must point at a real form control; duplicates flagged. | error | no |
| `button-type` | `<button>` inside `<form>` must set `type=` (defaults to submit, a common footgun). | warning | yes |
| `iframe-title` | `<iframe>` needs a `title` (or `aria-label`) so screen readers can announce it. | warning | no |
| `duplicate-id` | `id` attributes must be unique per document. | error | no |
| `responsive-images` | Flags `<img>` missing `srcset` or `loading="lazy"` hints. | info | no |
| `html-has-lang` | `<html>` must declare a `lang` attribute. | error | yes |
| `page-title` | Full documents need a non-empty `<title>`. | warning | no |

Run `designlint --list-rules` for the live rule table at your installed version.

All rules read both inline `style="..."` attributes **and** declarations from `<style>` blocks inside the same document. Simple class/id/tag selectors are supported; descendant combinators and pseudo-classes are ignored.

## Configuration

Pass a JSON file with `--config`:

```json
{
  "rules": {
    "colorContrast": { "enabled": true, "severity": "error", "minRatio": 4.5, "minRatioLarge": 3.0 },
    "spacingConsistency": { "enabled": true, "severity": "info", "baseUnit": 8 },
    "responsiveImages": { "enabled": false, "severity": "off" }
  }
}
```

Every rule accepts `enabled` (boolean) and `severity` (`error | warning | info | off`). Rule-specific knobs are listed in the rules table above.

## Output formats

- **`text`** (default) — human-readable, colorized for TTY, clustered per file.
- **`json`** — structured results for piping into other tools.
- **`sarif`** — SARIF 2.1.0; upload to GitHub Code Scanning for inline PR annotations and Security tab surface.
- **`github`** — `::error`/`::warning`/`::notice` workflow commands. GitHub Actions turns these into inline PR file annotations.

## Architecture

```
HTML input
  -> parse5 (with source locations)     -> DOM
  -> css-tree (<style> + inline)        -> property maps
    for each element:
      effective style = <style>-block decls + inline style (inline wins)
      each rule walks elements + reports LintIssue[] (with optional Fix offsets)
  -> scorer + formatter
```

parse5 gives us byte offsets for every open tag, which is what makes autofixes safe: we splice replacements at known-good positions, never regex-rewrite.

## Development

```bash
npm install
npm run build
npm test
npm run dev       # tsc --watch
```

Run the CLI from source without building:

```bash
npx tsx src/cli.ts examples/dirty.html
```

## License

MIT
