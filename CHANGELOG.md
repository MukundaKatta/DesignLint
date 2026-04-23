# Changelog

All notable changes to this project will be documented in this file.
The format loosely follows [Keep a Changelog](https://keepachangelog.com/),
and versions use [SemVer](https://semver.org/).

## [0.4.0] - 2026-04-22

### Added
- `label-for-valid` rule: `<label for="id">` must point at a real form
  control. Catches typos, orphan labels after refactors, and duplicate
  labels pointing at the same id.
- `iframe-title` rule: `<iframe>` needs a `title` (or `aria-label`) so
  screen readers can announce it.
- CLI: `-q` / `--quiet` suppresses warnings and info, showing only errors.
- CLI: config auto-discovery — if `--config` isn't set, walks up from cwd
  looking for `.designlintrc.json`. Falls back to defaults if none found.
- CI: release workflow (`.github/workflows/release.yml`) that cuts a GitHub
  release from the `CHANGELOG.md` entry when a `vX.Y.Z` tag is pushed.

## [0.3.0] - 2026-04-22

### Added
- `html-has-lang` rule: require `lang` on `<html>` (fixable — inserts
  `lang="en"`).
- `page-title` rule: full documents must have a non-empty `<title>`.
- `empty-heading` rule: flag headings that contain only whitespace, or only
  an unlabeled `<img>`. Respects `aria-label` / `aria-labelledby`.
- `button-type` rule: flag `<button>` inside `<form>` with no `type=`
  attribute (defaults to submit — common footgun). Fixable with
  `type="button"`.
- CLI: `--list-rules` prints all rule IDs, severities, and summaries.
- CLI: `designlint init [path]` writes a default config file; refuses to
  overwrite unless `--force`.

### Changed
- `color-contrast` now resolves `background-color` up the ancestor chain.
  Previously the rule only fired when both `color` and `background-color`
  were set on the same element, missing most real-world issues where the
  text sets color and the container sets the background. When no ancestor
  declares a solid background, we fall back to white (the browser default).
- `image-alt-text` now:
  - Covers `<input type="image">` (needs alt to announce its action).
  - Flags "junk" alt values (filename-like, generic `"image"` / `"photo"` /
    `"picture"`, or alt equal to the `src` basename).
  - Accepts `aria-label` as a substitute for `alt`.
- `viewport-meta` now also flags zoom lockouts: `user-scalable=no` and
  `maximum-scale<=1` (WCAG 1.4.4).

## [0.2.0] - 2026-04-22

### Changed
- Complete rewrite on top of parse5 + css-tree. Rules now see a real DOM
  with source locations instead of pattern-matching regexes.
- Rule configs accept `enabled` / `severity` plus rule-specific knobs.
- Autofix engine applies non-overlapping fixes from the end of the source
  backwards, keeping byte offsets valid across multiple fixes.
- Scoped package name: `@mukundakatta/designlint`.

### Added
- New rules: `duplicate-id`, `responsive-images`, `form-label`,
  `link-rel-noopener`.
- Output formats: `text`, `json`, `sarif` (2.1.0), `github`
  (Actions annotations).
- GitHub Action wrapper with SARIF upload support.

## [0.1.0] - 2026-04-21

Initial release.
