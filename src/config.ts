/**
 * DesignLint Configuration
 * Default thresholds, rule toggles, and severity levels.
 */

export type Severity = "error" | "warning" | "info";

export interface RuleConfig {
  enabled: boolean;
  severity: Severity;
}

export interface DesignLintConfig {
  rules: {
    colorContrast: RuleConfig & { minRatio: number };
    fontSizeMinimum: RuleConfig & { minPx: number };
    spacingConsistency: RuleConfig & { baseUnit: number };
    buttonSize: RuleConfig & { minWidthPx: number; minHeightPx: number };
    headingHierarchy: RuleConfig;
    imageAltText: RuleConfig;
    viewportMeta: RuleConfig;
  };
}

export const DEFAULT_CONFIG: DesignLintConfig = {
  rules: {
    colorContrast: {
      enabled: true,
      severity: "error",
      minRatio: 4.5, // WCAG AA for normal text
    },
    fontSizeMinimum: {
      enabled: true,
      severity: "warning",
      minPx: 12,
    },
    spacingConsistency: {
      enabled: true,
      severity: "info",
      baseUnit: 4, // spacing should be multiples of 4px
    },
    buttonSize: {
      enabled: true,
      severity: "error",
      minWidthPx: 44,
      minHeightPx: 44, // WCAG 2.5.5 target size
    },
    headingHierarchy: {
      enabled: true,
      severity: "warning",
    },
    imageAltText: {
      enabled: true,
      severity: "error",
    },
    viewportMeta: {
      enabled: true,
      severity: "warning",
    },
  },
};

/** Deep-merge a partial config over the defaults. */
export function mergeConfig(
  overrides: Partial<DesignLintConfig> | undefined
): DesignLintConfig {
  if (!overrides) return { ...DEFAULT_CONFIG };
  const merged = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as DesignLintConfig;
  if (overrides.rules) {
    for (const key of Object.keys(overrides.rules) as Array<
      keyof typeof overrides.rules
    >) {
      if (overrides.rules[key]) {
        (merged.rules as any)[key] = {
          ...(merged.rules as any)[key],
          ...overrides.rules[key],
        };
      }
    }
  }
  return merged;
}
