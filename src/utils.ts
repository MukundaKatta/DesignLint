/**
 * DesignLint Utilities
 * Color parsing, contrast calculation, and CSS value helpers.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Parse a hex color string (#RGB or #RRGGBB) to RGB values. */
export function hexToRGB(hex: string): RGB | null {
  const cleaned = hex.replace(/^#/, "");
  let r: number, g: number, b: number;

  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  } else {
    return null;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}

/** Parse rgb(r, g, b) string to RGB values. */
export function parseRGBString(value: string): RGB | null {
  const match = value.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (!match) return null;
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
  };
}

/** Parse any supported color string to RGB. */
export function parseColor(value: string): RGB | null {
  const trimmed = value.trim().toLowerCase();
  // Named colors (subset)
  const named: Record<string, string> = {
    white: "#ffffff",
    black: "#000000",
    red: "#ff0000",
    green: "#008000",
    blue: "#0000ff",
    yellow: "#ffff00",
    gray: "#808080",
    grey: "#808080",
    orange: "#ffa500",
    purple: "#800080",
  };
  if (named[trimmed]) return hexToRGB(named[trimmed]);
  if (trimmed.startsWith("#")) return hexToRGB(trimmed);
  if (trimmed.startsWith("rgb(")) return parseRGBString(trimmed);
  return null;
}

/**
 * Calculate the relative luminance of an RGB color.
 * Per WCAG 2.1 specification.
 */
export function relativeLuminance(color: RGB): number {
  const [rs, gs, bs] = [color.r / 255, color.g / 255, color.b / 255].map(
    (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate the contrast ratio between two colors.
 * Returns a value between 1 and 21.
 */
export function contrastRatio(fg: RGB, bg: RGB): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse a CSS size value (e.g. "14px", "1.2rem", "0.8em") and return the
 * approximate pixel value. Assumes 1rem = 16px.
 */
export function parseCSSSize(value: string): number | null {
  const match = value.match(/^([\d.]+)(px|rem|em|pt|vw|vh|%)$/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case "px":
      return num;
    case "rem":
    case "em":
      return num * 16;
    case "pt":
      return num * (4 / 3);
    default:
      return null; // vw/vh/% are context-dependent
  }
}

/**
 * Extract all inline style properties from a style attribute string.
 */
export function parseInlineStyles(
  styleAttr: string
): Record<string, string> {
  const styles: Record<string, string> = {};
  const pairs = styleAttr.split(";").filter(Boolean);
  for (const pair of pairs) {
    const colonIdx = pair.indexOf(":");
    if (colonIdx === -1) continue;
    const prop = pair.substring(0, colonIdx).trim().toLowerCase();
    const val = pair.substring(colonIdx + 1).trim();
    if (prop) styles[prop] = val;
  }
  return styles;
}
