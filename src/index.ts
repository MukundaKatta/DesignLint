/**
 * DesignLint — UI/UX Design Review Tool
 * Analyze HTML/CSS for accessibility, contrast, spacing, and design best practices.
 *
 * @packageDocumentation
 */

export { DesignLinter, type LintIssue, type LintReport } from "./core.js";
export {
  type DesignLintConfig,
  type RuleConfig,
  type Severity,
  DEFAULT_CONFIG,
  mergeConfig,
} from "./config.js";
export {
  hexToRGB,
  parseColor,
  contrastRatio,
  relativeLuminance,
  parseCSSSize,
  parseInlineStyles,
  type RGB,
} from "./utils.js";
