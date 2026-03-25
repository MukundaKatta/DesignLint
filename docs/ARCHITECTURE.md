# Architecture

## Overview

DesignLint is a modular UI/UX design linter that analyzes HTML strings for design best practices, accessibility compliance, and visual consistency.

## Module Structure

```
src/
├── index.ts    — Public API exports
├── core.ts     — DesignLinter engine with all rule implementations
├── config.ts   — Default configuration, types, and merge logic
└── utils.ts    — Color parsing, contrast math, CSS value helpers
```

## How It Works

1. **Input**: The `DesignLinter.lint(html)` method receives an HTML string.
2. **Rule Execution**: Each enabled rule scans the HTML using regex-based parsing to find relevant elements and inline styles.
3. **Issue Collection**: Rules emit `LintIssue` objects with an id, severity, message, element reference, and suggestion.
4. **Scoring**: Issues are aggregated into a `LintReport` with a 0-100 score (errors deduct 15 points, warnings 7, info 2).

## Rules

| Rule ID              | Checks                                      | Severity |
|----------------------|----------------------------------------------|----------|
| `color-contrast`     | WCAG AA contrast ratio (4.5:1 minimum)       | error    |
| `font-size-minimum`  | Text below 12px                              | warning  |
| `spacing-consistency` | Spacing not on 4px grid                     | info     |
| `button-size`        | Touch targets below 44x44px                  | error    |
| `heading-hierarchy`  | Skipped heading levels (e.g. h1 then h3)     | warning  |
| `image-alt-text`     | Missing or empty alt on `<img>`              | error    |
| `viewport-meta`      | Missing responsive viewport in full documents | warning  |

## Configuration

All rules can be toggled, have their severity changed, or have thresholds adjusted via the `DesignLintConfig` object passed to the constructor.
