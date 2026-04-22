/**
 * Shared types for rule modules.
 */

import type { DesignLintConfig, Severity } from "../config.js";
import type { ParsedDoc } from "../parse.js";

export interface LintIssue {
  id: string;
  severity: Severity;
  message: string;
  element: string;
  suggestion: string;
  /** 1-based line number when the parser can provide it. */
  line?: number;
  /** When a rule can autofix the issue, the fixer is attached here. */
  fix?: Fix;
}

export interface Fix {
  /** Absolute byte offsets into the original HTML source. */
  start: number;
  end: number;
  /** Replacement text. */
  replacement: string;
  /** Human-readable description of what the fix does. */
  description: string;
}

export interface LintReport {
  issues: LintIssue[];
  score: number;
  summary: string;
}

export interface RuleContext {
  doc: ParsedDoc;
  /** Original HTML source, for locating nodes and computing fixes. */
  source: string;
  config: DesignLintConfig;
}

export type Rule = (ctx: RuleContext) => LintIssue[];
