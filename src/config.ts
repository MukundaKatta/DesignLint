/**
 * DesignLint configuration: defaults, types, and merge helper.
 */

export type Severity = "error" | "warning" | "info" | "off";

export interface BaseRuleConfig {
  /** Turn the rule on or off without needing severity: "off". */
  enabled: boolean;
  severity: Severity;
}

export interface RuleConfigs {
  colorContrast: BaseRuleConfig & { minRatio: number; minRatioLarge: number };
  fontSizeMinimum: BaseRuleConfig & { minPx: number };
  spacingConsistency: BaseRuleConfig & { baseUnit: number };
  buttonSize: BaseRuleConfig & { minWidthPx: number; minHeightPx: number };
  headingHierarchy: BaseRuleConfig;
  imageAltText: BaseRuleConfig;
  viewportMeta: BaseRuleConfig;
  linkRelNoopener: BaseRuleConfig;
  formLabel: BaseRuleConfig;
  duplicateId: BaseRuleConfig;
  responsiveImages: BaseRuleConfig;
}

export interface DesignLintConfig {
  rules: RuleConfigs;
}

export const DEFAULT_CONFIG: DesignLintConfig = {
  rules: {
    colorContrast: {
      enabled: true,
      severity: "error",
      minRatio: 4.5,
      minRatioLarge: 3.0,
    },
    fontSizeMinimum: {
      enabled: true,
      severity: "warning",
      minPx: 12,
    },
    spacingConsistency: {
      enabled: true,
      severity: "info",
      baseUnit: 4,
    },
    buttonSize: {
      enabled: true,
      severity: "error",
      minWidthPx: 44,
      minHeightPx: 44,
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
    linkRelNoopener: {
      enabled: true,
      severity: "warning",
    },
    formLabel: {
      enabled: true,
      severity: "error",
    },
    duplicateId: {
      enabled: true,
      severity: "error",
    },
    responsiveImages: {
      enabled: true,
      severity: "info",
    },
  },
};

/** Deep-merge a partial config over the defaults. */
export function mergeConfig(
  overrides: Partial<DesignLintConfig> | undefined
): DesignLintConfig {
  const merged = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as DesignLintConfig;
  if (!overrides?.rules) return merged;

  for (const key of Object.keys(overrides.rules) as Array<keyof RuleConfigs>) {
    const patch = overrides.rules[key];
    if (!patch) continue;
    const existing = merged.rules[key] as unknown as Record<string, unknown>;
    const next = { ...existing, ...(patch as unknown as Record<string, unknown>) };
    (merged.rules as unknown as Record<string, unknown>)[key] = next;
  }
  return merged;
}

export function ruleEnabled(rule: BaseRuleConfig): boolean {
  return rule.enabled && rule.severity !== "off";
}
