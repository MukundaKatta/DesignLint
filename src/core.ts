/**
 * DesignLint Core Engine
 * Analyzes HTML/CSS strings for UI/UX design best practices.
 */

import {
  parseColor,
  contrastRatio,
  parseCSSSize,
  parseInlineStyles,
} from "./utils.js";
import {
  type DesignLintConfig,
  type Severity,
  DEFAULT_CONFIG,
  mergeConfig,
} from "./config.js";

// ── Result types ──────────────────────────────────────────────

export interface LintIssue {
  id: string;
  severity: Severity;
  message: string;
  element: string;
  suggestion: string;
}

export interface LintReport {
  issues: LintIssue[];
  score: number; // 0-100
  summary: string;
}

// ── DesignLinter ──────────────────────────────────────────────

export class DesignLinter {
  private config: DesignLintConfig;

  constructor(config?: Partial<DesignLintConfig>) {
    this.config = mergeConfig(config);
  }

  /** Run all enabled rules against the provided HTML string. */
  lint(html: string): LintReport {
    const issues: LintIssue[] = [];

    if (this.config.rules.colorContrast.enabled) {
      issues.push(...this.checkColorContrast(html));
    }
    if (this.config.rules.fontSizeMinimum.enabled) {
      issues.push(...this.checkFontSize(html));
    }
    if (this.config.rules.spacingConsistency.enabled) {
      issues.push(...this.checkSpacing(html));
    }
    if (this.config.rules.buttonSize.enabled) {
      issues.push(...this.checkButtonSize(html));
    }
    if (this.config.rules.headingHierarchy.enabled) {
      issues.push(...this.checkHeadingHierarchy(html));
    }
    if (this.config.rules.imageAltText.enabled) {
      issues.push(...this.checkImageAlt(html));
    }
    if (this.config.rules.viewportMeta.enabled) {
      issues.push(...this.checkViewportMeta(html));
    }

    const score = this.calculateScore(issues);
    const summary = this.buildSummary(issues, score);
    return { issues, score, summary };
  }

  // ── Rule: Color Contrast (WCAG AA) ───────────────────────

  private checkColorContrast(html: string): LintIssue[] {
    const issues: LintIssue[] = [];
    const rule = this.config.rules.colorContrast;
    // Match elements with both color and background-color in style attr
    const tagRe = /<(\w+)\s[^>]*style="([^"]*)"[^>]*>/gi;
    let match: RegExpExecArray | null;

    while ((match = tagRe.exec(html)) !== null) {
      const tag = match[1];
      const styleStr = match[2];
      const styles = parseInlineStyles(styleStr);

      const fgStr = styles["color"];
      const bgStr = styles["background-color"] || styles["background"];

      if (fgStr && bgStr) {
        const fg = parseColor(fgStr);
        const bg = parseColor(bgStr);
        if (fg && bg) {
          const ratio = contrastRatio(fg, bg);
          if (ratio < rule.minRatio) {
            issues.push({
              id: "color-contrast",
              severity: rule.severity,
              message: `Color contrast ratio ${ratio.toFixed(2)}:1 is below the WCAG AA minimum of ${rule.minRatio}:1.`,
              element: `<${tag} style="...">`,
              suggestion: `Increase contrast between foreground (${fgStr}) and background (${bgStr}). Use a darker text or lighter background.`,
            });
          }
        }
      }
    }
    return issues;
  }

  // ── Rule: Font Size Minimum ───────────────────────────────

  private checkFontSize(html: string): LintIssue[] {
    const issues: LintIssue[] = [];
    const rule = this.config.rules.fontSizeMinimum;
    const tagRe = /<(\w+)\s[^>]*style="([^"]*)"[^>]*>/gi;
    let match: RegExpExecArray | null;

    while ((match = tagRe.exec(html)) !== null) {
      const tag = match[1];
      const styles = parseInlineStyles(match[2]);
      const fontSize = styles["font-size"];

      if (fontSize) {
        const px = parseCSSSize(fontSize);
        if (px !== null && px < rule.minPx) {
          issues.push({
            id: "font-size-minimum",
            severity: rule.severity,
            message: `Font size ${fontSize} (${px}px) is below the minimum of ${rule.minPx}px.`,
            element: `<${tag} style="...">`,
            suggestion: `Increase font size to at least ${rule.minPx}px for readability.`,
          });
        }
      }
    }
    return issues;
  }

  // ── Rule: Spacing Consistency ─────────────────────────────

  private checkSpacing(html: string): LintIssue[] {
    const issues: LintIssue[] = [];
    const rule = this.config.rules.spacingConsistency;
    const tagRe = /<(\w+)\s[^>]*style="([^"]*)"[^>]*>/gi;
    let match: RegExpExecArray | null;
    const spacingProps = ["margin", "padding", "gap", "margin-top", "margin-bottom", "margin-left", "margin-right", "padding-top", "padding-bottom", "padding-left", "padding-right"];

    while ((match = tagRe.exec(html)) !== null) {
      const tag = match[1];
      const styles = parseInlineStyles(match[2]);

      for (const prop of spacingProps) {
        const val = styles[prop];
        if (!val) continue;
        // Check each value token (e.g. "8px 5px" has two tokens)
        const tokens = val.split(/\s+/);
        for (const token of tokens) {
          const px = parseCSSSize(token);
          if (px !== null && px > 0 && px % rule.baseUnit !== 0) {
            issues.push({
              id: "spacing-consistency",
              severity: rule.severity,
              message: `Spacing value ${token} is not a multiple of the ${rule.baseUnit}px base unit.`,
              element: `<${tag} style="...">`,
              suggestion: `Use multiples of ${rule.baseUnit}px (e.g. ${Math.round(px / rule.baseUnit) * rule.baseUnit}px) for consistent spacing.`,
            });
          }
        }
      }
    }
    return issues;
  }

  // ── Rule: Button Size Accessibility ───────────────────────

  private checkButtonSize(html: string): LintIssue[] {
    const issues: LintIssue[] = [];
    const rule = this.config.rules.buttonSize;
    const btnRe = /<(button|a|input)\s[^>]*style="([^"]*)"[^>]*>/gi;
    let match: RegExpExecArray | null;

    while ((match = btnRe.exec(html)) !== null) {
      const tag = match[1];
      const styles = parseInlineStyles(match[2]);

      const width = styles["width"] || styles["min-width"];
      const height = styles["height"] || styles["min-height"];

      if (width) {
        const wPx = parseCSSSize(width);
        if (wPx !== null && wPx < rule.minWidthPx) {
          issues.push({
            id: "button-size",
            severity: rule.severity,
            message: `Interactive element width ${width} (${wPx}px) is below the minimum touch target of ${rule.minWidthPx}px.`,
            element: `<${tag} style="...">`,
            suggestion: `Set minimum width to ${rule.minWidthPx}px for accessible touch targets.`,
          });
        }
      }

      if (height) {
        const hPx = parseCSSSize(height);
        if (hPx !== null && hPx < rule.minHeightPx) {
          issues.push({
            id: "button-size",
            severity: rule.severity,
            message: `Interactive element height ${height} (${hPx}px) is below the minimum touch target of ${rule.minHeightPx}px.`,
            element: `<${tag} style="...">`,
            suggestion: `Set minimum height to ${rule.minHeightPx}px for accessible touch targets.`,
          });
        }
      }
    }
    return issues;
  }

  // ── Rule: Heading Hierarchy ───────────────────────────────

  private checkHeadingHierarchy(html: string): LintIssue[] {
    const issues: LintIssue[] = [];
    const rule = this.config.rules.headingHierarchy;
    const headingRe = /<(h[1-6])\b[^>]*>/gi;
    let match: RegExpExecArray | null;
    let lastLevel = 0;

    while ((match = headingRe.exec(html)) !== null) {
      const tag = match[1].toLowerCase();
      const level = parseInt(tag[1], 10);

      if (lastLevel > 0 && level > lastLevel + 1) {
        issues.push({
          id: "heading-hierarchy",
          severity: rule.severity,
          message: `Heading <${tag}> skips level(s) after <h${lastLevel}>. Headings should not skip levels.`,
          element: `<${tag}>`,
          suggestion: `Use <h${lastLevel + 1}> instead of <${tag}> to maintain a logical heading hierarchy.`,
        });
      }
      lastLevel = level;
    }
    return issues;
  }

  // ── Rule: Image Alt Text ──────────────────────────────────

  private checkImageAlt(html: string): LintIssue[] {
    const issues: LintIssue[] = [];
    const rule = this.config.rules.imageAltText;
    const imgRe = /<img\s([^>]*)>/gi;
    let match: RegExpExecArray | null;

    while ((match = imgRe.exec(html)) !== null) {
      const attrs = match[1];
      const hasAlt = /alt\s*=\s*"[^"]+"/i.test(attrs);
      const emptyAlt = /alt\s*=\s*""/i.test(attrs);

      if (!hasAlt || emptyAlt) {
        const srcMatch = attrs.match(/src\s*=\s*"([^"]*)"/i);
        const src = srcMatch ? srcMatch[1] : "unknown";
        issues.push({
          id: "image-alt-text",
          severity: rule.severity,
          message: `Image is missing meaningful alt text.`,
          element: `<img src="${src}">`,
          suggestion: `Add a descriptive alt attribute that conveys the image content or purpose.`,
        });
      }
    }
    return issues;
  }

  // ── Rule: Responsive Viewport Meta ────────────────────────

  private checkViewportMeta(html: string): LintIssue[] {
    const issues: LintIssue[] = [];
    const rule = this.config.rules.viewportMeta;

    // Only check if the HTML looks like a full document (has <head> or <html>)
    if (/<html|<head/i.test(html)) {
      const hasViewport =
        /<meta\s[^>]*name\s*=\s*"viewport"[^>]*content\s*=\s*"[^"]*width\s*=/i.test(
          html
        ) ||
        /<meta\s[^>]*content\s*=\s*"[^"]*width\s*=[^"]*"[^>]*name\s*=\s*"viewport"/i.test(
          html
        );

      if (!hasViewport) {
        issues.push({
          id: "viewport-meta",
          severity: rule.severity,
          message: `Document is missing a responsive viewport meta tag.`,
          element: `<head>`,
          suggestion: `Add <meta name="viewport" content="width=device-width, initial-scale=1"> inside <head>.`,
        });
      }
    }
    return issues;
  }

  // ── Scoring ───────────────────────────────────────────────

  private calculateScore(issues: LintIssue[]): number {
    let deductions = 0;
    for (const issue of issues) {
      switch (issue.severity) {
        case "error":
          deductions += 15;
          break;
        case "warning":
          deductions += 7;
          break;
        case "info":
          deductions += 2;
          break;
      }
    }
    return Math.max(0, Math.min(100, 100 - deductions));
  }

  private buildSummary(issues: LintIssue[], score: number): string {
    const errors = issues.filter((i) => i.severity === "error").length;
    const warnings = issues.filter((i) => i.severity === "warning").length;
    const infos = issues.filter((i) => i.severity === "info").length;

    if (issues.length === 0) {
      return "No design issues found. Great work!";
    }

    const parts: string[] = [];
    if (errors) parts.push(`${errors} error(s)`);
    if (warnings) parts.push(`${warnings} warning(s)`);
    if (infos) parts.push(`${infos} info(s)`);

    return `Found ${issues.length} issue(s): ${parts.join(", ")}. Design score: ${score}/100.`;
  }
}
