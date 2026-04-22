/**
 * GitHub Actions workflow commands so `designlint --format github` annotates
 * lines directly in the PR file view when run in a workflow.
 *
 * Format reference:
 *   ::error file=path,line=N,col=M::message
 */

import type { LintIssue, LintReport } from "../rules/types.js";

export interface GithubInput {
  file?: string;
  report: LintReport;
}

export function formatGithub(inputs: GithubInput[]): string {
  const lines: string[] = [];
  for (const { file, report } of inputs) {
    for (const issue of report.issues) {
      lines.push(formatLine(issue, file));
    }
  }
  return lines.join("\n");
}

function formatLine(issue: LintIssue, file?: string): string {
  const type = issue.severity === "info" ? "notice" : issue.severity === "warning" ? "warning" : "error";
  const params = [
    file ? `file=${escapeParam(file)}` : "",
    issue.line ? `line=${issue.line}` : "",
    `title=${escapeParam(issue.id)}`,
  ]
    .filter(Boolean)
    .join(",");
  const message = escapeData(`${issue.message} ${issue.suggestion}`);
  return `::${type} ${params}::${message}`;
}

function escapeData(s: string): string {
  return s.replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/%/g, "%25");
}

function escapeParam(s: string): string {
  return s
    .replace(/\r/g, "%0D")
    .replace(/\n/g, "%0A")
    .replace(/:/g, "%3A")
    .replace(/,/g, "%2C")
    .replace(/%/g, "%25");
}
