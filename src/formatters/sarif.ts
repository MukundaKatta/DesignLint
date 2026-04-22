/**
 * SARIF 2.1.0 output so GitHub's Code Scanning UI can ingest DesignLint
 * results directly (Security tab, inline annotations).
 */

import type { LintIssue, LintReport } from "../rules/types.js";

export interface SarifInput {
  file?: string;
  report: LintReport;
}

const RULE_HELP: Record<string, { short: string; fullUri?: string }> = {
  "color-contrast": { short: "Low color contrast", fullUri: "https://www.w3.org/TR/WCAG21/#contrast-minimum" },
  "font-size-minimum": { short: "Font size below readable threshold" },
  "spacing-consistency": { short: "Off-grid spacing" },
  "button-size": { short: "Touch target too small", fullUri: "https://www.w3.org/TR/WCAG21/#target-size" },
  "heading-hierarchy": { short: "Heading hierarchy skipped" },
  "image-alt-text": { short: "Missing image alt text", fullUri: "https://www.w3.org/TR/WCAG21/#non-text-content" },
  "viewport-meta": { short: "Missing responsive viewport meta" },
  "link-rel-noopener": { short: "target=\"_blank\" without rel=\"noopener\"" },
  "form-label": { short: "Form control without label" },
  "duplicate-id": { short: "Duplicate id attribute" },
  "responsive-images": { short: "Responsive-image hint" },
};

export function formatSarif(inputs: SarifInput[]): string {
  const ruleIds = new Set<string>();
  const results: unknown[] = [];

  for (const { file, report } of inputs) {
    for (const issue of report.issues) {
      ruleIds.add(issue.id);
      results.push(issueToResult(issue, file));
    }
  }

  const rules = [...ruleIds].sort().map((id) => {
    const meta = RULE_HELP[id] ?? { short: id };
    return {
      id,
      shortDescription: { text: meta.short },
      ...(meta.fullUri ? { helpUri: meta.fullUri } : {}),
      defaultConfiguration: { level: "warning" },
    };
  });

  const sarif = {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "designlint",
            informationUri: "https://github.com/MukundaKatta/DesignLint",
            rules,
          },
        },
        results,
      },
    ],
  };
  return JSON.stringify(sarif, null, 2);
}

function issueToResult(issue: LintIssue, file?: string) {
  const location = file
    ? {
        physicalLocation: {
          artifactLocation: { uri: file },
          region: {
            startLine: issue.line ?? 1,
          },
        },
      }
    : undefined;

  return {
    ruleId: issue.id,
    level: sarifLevel(issue.severity),
    message: { text: `${issue.message} — ${issue.suggestion}` },
    ...(location ? { locations: [location] } : {}),
  };
}

function sarifLevel(sev: LintIssue["severity"]): "error" | "warning" | "note" | "none" {
  if (sev === "error") return "error";
  if (sev === "warning") return "warning";
  if (sev === "info") return "note";
  return "none";
}
