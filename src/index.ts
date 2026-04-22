/**
 * DesignLint public API.
 */

export { DesignLinter } from "./core.js";
export { applyFixes } from "./fix.js";
export {
  DEFAULT_CONFIG,
  mergeConfig,
  ruleEnabled,
  type DesignLintConfig,
  type RuleConfigs,
  type Severity,
  type BaseRuleConfig,
} from "./config.js";
export type { LintIssue, LintReport, Fix, Rule, RuleContext } from "./rules/types.js";
export {
  hexToRGB,
  parseColor,
  parseRGBString,
  parseHSLString,
  contrastRatio,
  relativeLuminance,
  parseCSSSize,
  type RGB,
} from "./utils.js";
export { parseHtml } from "./parse.js";
export { formatText } from "./formatters/text.js";
export { formatJson } from "./formatters/json.js";
export { formatSarif } from "./formatters/sarif.js";
export { formatGithub } from "./formatters/github.js";
