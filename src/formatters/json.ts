import type { LintReport } from "../rules/types.js";

export interface JsonResult {
  file?: string;
  report: LintReport;
}

export function formatJson(results: JsonResult[]): string {
  return JSON.stringify(results, null, 2);
}
