import pc from "picocolors";
import type { LintIssue, LintReport } from "../rules/types.js";

const SEVERITY_COLORS = {
  error: pc.red,
  warning: pc.yellow,
  info: pc.cyan,
  off: pc.dim,
} as const;

export function formatText(report: LintReport, filename?: string): string {
  const lines: string[] = [];
  if (filename) lines.push(pc.underline(filename));
  if (report.issues.length === 0) {
    lines.push(pc.green("  No issues. Score: 100/100"));
    return lines.join("\n");
  }
  for (const issue of report.issues) {
    lines.push(formatIssue(issue));
  }
  lines.push("");
  lines.push(pc.bold(`  ${report.summary}`));
  return lines.join("\n");
}

function formatIssue(issue: LintIssue): string {
  const color = SEVERITY_COLORS[issue.severity];
  const locStr = issue.line ? `line ${issue.line}` : "-";
  const prefix = `  ${locStr.padEnd(8)}`;
  const head = `${prefix}${color(issue.severity.padEnd(8))}${pc.dim(issue.id)}`;
  const msg = `    ${issue.message}`;
  const ctx = pc.dim(`    in: ${issue.element}`);
  const fix = issue.fix ? pc.green(`    fix: ${issue.fix.description}`) : "";
  const sugg = pc.dim(`    tip: ${issue.suggestion}`);
  return [head, msg, ctx, fix, sugg].filter(Boolean).join("\n");
}
