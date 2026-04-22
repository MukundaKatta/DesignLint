#!/usr/bin/env node
/**
 * designlint CLI.
 *
 * Examples:
 *   designlint index.html
 *   designlint 'src/**\/*.html'
 *   designlint https://example.com --format sarif > results.sarif
 *   designlint index.html --fix
 */

import { readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { Command } from "commander";
import { globby } from "globby";
import pc from "picocolors";

import { DesignLinter } from "./core.js";
import { applyFixes } from "./fix.js";
import { mergeConfig, type DesignLintConfig } from "./config.js";
import { formatText } from "./formatters/text.js";
import { formatJson } from "./formatters/json.js";
import { formatSarif } from "./formatters/sarif.js";
import { formatGithub } from "./formatters/github.js";
import type { LintReport } from "./rules/types.js";

type OutputFormat = "text" | "json" | "sarif" | "github";

interface CliOptions {
  config?: string;
  format: OutputFormat;
  fix: boolean;
  failOn: "error" | "warning" | "info" | "never";
  rule?: string[];
  output?: string;
}

async function main(): Promise<void> {
  const program = new Command()
    .name("designlint")
    .description("UI/UX design linter for HTML/CSS (accessibility, contrast, spacing, touch targets).")
    .argument("<inputs...>", "files, globs, or URLs")
    .option("-c, --config <path>", "JSON config file (see README for schema)")
    .option("-f, --format <type>", "output format: text | json | sarif | github", "text")
    .option("--fix", "apply autofixes in place", false)
    .option("--fail-on <level>", "exit nonzero when issues meet this severity: error|warning|info|never", "error")
    .option("--rule <id...>", "run only the specified rule IDs")
    .option("-o, --output <path>", "write output to a file instead of stdout")
    .version(readPackageVersion(), "-v, --version")
    .parse(process.argv);

  const rawInputs = program.args;
  const opts = program.opts<CliOptions>();
  const config = await loadConfig(opts.config);
  const results: Array<{ file?: string; source: string; report: LintReport }> = [];

  const files = await expandInputs(rawInputs);
  if (files.length === 0) {
    console.error(pc.red("No inputs matched."));
    process.exit(2);
  }

  const linter = new DesignLinter(applyRuleFilter(config, opts.rule));

  for (const { name, source } of files) {
    const report = linter.lint(source);
    results.push({ file: name, source, report });
  }

  if (opts.fix) {
    for (const r of results) {
      if (!r.file || r.file.startsWith("http")) continue;
      const { output, appliedCount } = applyFixes(r.source, r.report.issues);
      if (appliedCount > 0) {
        await writeFile(r.file, output, "utf8");
        console.error(pc.green(`[fixed] ${appliedCount} issue(s) in ${r.file}`));
      }
    }
  }

  const formatted = format(opts.format, results);
  if (opts.output) {
    await writeFile(opts.output, formatted, "utf8");
  } else {
    process.stdout.write(formatted + (opts.format === "text" ? "\n" : "\n"));
  }

  process.exit(computeExitCode(results, opts.failOn));
}

function applyRuleFilter(
  config: DesignLintConfig,
  enabled: string[] | undefined
): DesignLintConfig {
  if (!enabled || enabled.length === 0) return config;
  const wanted = new Set(enabled.map(kebabToCamel));
  const next: DesignLintConfig = JSON.parse(JSON.stringify(config));
  for (const key of Object.keys(next.rules) as Array<keyof typeof next.rules>) {
    if (!wanted.has(key)) next.rules[key].enabled = false;
  }
  return next;
}

function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

async function loadConfig(path: string | undefined): Promise<DesignLintConfig> {
  if (!path) return mergeConfig(undefined);
  const raw = await readFile(path, "utf8");
  return mergeConfig(JSON.parse(raw) as Partial<DesignLintConfig>);
}

async function expandInputs(inputs: string[]): Promise<Array<{ name: string; source: string }>> {
  const out: Array<{ name: string; source: string }> = [];
  for (const input of inputs) {
    if (/^https?:\/\//i.test(input)) {
      const res = await fetch(input);
      if (!res.ok) throw new Error(`Failed to fetch ${input}: ${res.status}`);
      out.push({ name: input, source: await res.text() });
      continue;
    }
    const matches = await globby(input, { onlyFiles: true, absolute: false });
    if (matches.length === 0) {
      try {
        const source = await readFile(input, "utf8");
        out.push({ name: input, source });
      } catch {
        // Skip if the input neither matches any files nor exists directly.
      }
      continue;
    }
    for (const m of matches) {
      const source = await readFile(m, "utf8");
      out.push({ name: m, source });
    }
  }
  return out;
}

function format(
  fmt: OutputFormat,
  results: Array<{ file?: string; source: string; report: LintReport }>
): string {
  switch (fmt) {
    case "json":
      return formatJson(results.map((r) => ({ file: r.file, report: r.report })));
    case "sarif":
      return formatSarif(results.map((r) => ({ file: r.file, report: r.report })));
    case "github":
      return formatGithub(results.map((r) => ({ file: r.file, report: r.report })));
    case "text":
    default:
      return results.map((r) => formatText(r.report, r.file)).join("\n\n");
  }
}

function computeExitCode(
  results: Array<{ report: LintReport }>,
  failOn: CliOptions["failOn"]
): number {
  if (failOn === "never") return 0;
  const levels = { info: 0, warning: 1, error: 2 } as const;
  const threshold = levels[failOn];
  for (const { report } of results) {
    for (const issue of report.issues) {
      const sev = issue.severity === "off" ? -1 : levels[issue.severity];
      if (sev >= threshold) return 1;
    }
  }
  return 0;
}

function readPackageVersion(): string {
  try {
    const url = new URL("../package.json", import.meta.url);
    const json = readFileSync(url, "utf8");
    return (JSON.parse(json) as { version: string }).version;
  } catch {
    return "0.0.0";
  }
}

main().catch((err: unknown) => {
  console.error(pc.red(String((err as Error)?.message ?? err)));
  process.exit(2);
});
