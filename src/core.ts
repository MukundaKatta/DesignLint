/**
 * DesignLint core. Orchestrates parsing, rule evaluation, and scoring.
 */

import { parseHtml } from "./parse.js";
import { mergeConfig, type DesignLintConfig } from "./config.js";
import { ALL_RULES, type LintIssue, type LintReport, type RuleContext } from "./rules/index.js";

export class DesignLinter {
  private config: DesignLintConfig;

  constructor(config?: Partial<DesignLintConfig>) {
    this.config = mergeConfig(config);
  }

  lint(html: string): LintReport {
    const doc = parseHtml(html);
    const ctx: RuleContext = { doc, source: html, config: this.config };
    const issues: LintIssue[] = [];
    for (const rule of ALL_RULES) {
      issues.push(...rule(ctx));
    }
    const score = calculateScore(issues);
    const summary = buildSummary(issues, score);
    return { issues, score, summary };
  }
}

function calculateScore(issues: LintIssue[]): number {
  let deduct = 0;
  for (const i of issues) {
    switch (i.severity) {
      case "error":
        deduct += 12;
        break;
      case "warning":
        deduct += 5;
        break;
      case "info":
        deduct += 1;
        break;
    }
  }
  return Math.max(0, Math.min(100, 100 - deduct));
}

function buildSummary(issues: LintIssue[], score: number): string {
  if (issues.length === 0) return "No design issues found.";
  const err = issues.filter((i) => i.severity === "error").length;
  const warn = issues.filter((i) => i.severity === "warning").length;
  const info = issues.filter((i) => i.severity === "info").length;
  const parts: string[] = [];
  if (err) parts.push(`${err} error${err > 1 ? "s" : ""}`);
  if (warn) parts.push(`${warn} warning${warn > 1 ? "s" : ""}`);
  if (info) parts.push(`${info} info`);
  return `${issues.length} issue${issues.length > 1 ? "s" : ""} (${parts.join(", ")}). Score ${score}/100.`;
}

export type { LintIssue, LintReport } from "./rules/index.js";
