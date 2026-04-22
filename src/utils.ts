/**
 * Color, contrast, and size helpers.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
  /** Optional alpha in [0,1]. Defaults to 1 when absent. */
  a?: number;
}

/**
 * Named color lookup. Covers the 140 CSS named colors.
 * Kept inline to avoid a runtime dependency.
 */
const NAMED_COLORS: Record<string, string> = {
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  black: "#000000",
  blanchedalmond: "#ffebcd",
  blue: "#0000ff",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgreen: "#006400",
  darkgrey: "#a9a9a9",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  grey: "#808080",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2",
  lightgray: "#d3d3d3",
  lightgreen: "#90ee90",
  lightgrey: "#d3d3d3",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  maroon: "#800000",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370db",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  navy: "#000080",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#db7093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#800080",
  rebeccapurple: "#663399",
  red: "#ff0000",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32",
};

export function hexToRGB(hex: string): RGB | null {
  const cleaned = hex.replace(/^#/, "");
  let r: number;
  let g: number;
  let b: number;
  let a = 1;

  if (cleaned.length === 3) {
    r = parseInt(cleaned[0]! + cleaned[0], 16);
    g = parseInt(cleaned[1]! + cleaned[1], 16);
    b = parseInt(cleaned[2]! + cleaned[2], 16);
  } else if (cleaned.length === 4) {
    r = parseInt(cleaned[0]! + cleaned[0], 16);
    g = parseInt(cleaned[1]! + cleaned[1], 16);
    b = parseInt(cleaned[2]! + cleaned[2], 16);
    a = parseInt(cleaned[3]! + cleaned[3], 16) / 255;
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  } else if (cleaned.length === 8) {
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
    a = parseInt(cleaned.substring(6, 8), 16) / 255;
  } else {
    return null;
  }

  if ([r, g, b].some(Number.isNaN)) return null;
  return { r, g, b, a };
}

export function parseRGBString(value: string): RGB | null {
  const m = value.match(
    /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.%]+))?\s*\)/i
  );
  if (!m) return null;
  const r = clamp(parseFloat(m[1]!), 0, 255);
  const g = clamp(parseFloat(m[2]!), 0, 255);
  const b = clamp(parseFloat(m[3]!), 0, 255);
  let a = 1;
  if (m[4]) {
    const raw = m[4];
    a = raw.endsWith("%") ? parseFloat(raw) / 100 : parseFloat(raw);
    if (!Number.isFinite(a)) a = 1;
    a = clamp(a, 0, 1);
  }
  return { r, g, b, a };
}

/**
 * Parse hsl/hsla strings.
 */
export function parseHSLString(value: string): RGB | null {
  const m = value.match(
    /hsla?\(\s*([\d.]+)(deg|rad|turn)?[,\s]+([\d.]+)%[,\s]+([\d.]+)%(?:[,/\s]+([\d.%]+))?\s*\)/i
  );
  if (!m) return null;
  let h = parseFloat(m[1]!);
  const unit = m[2];
  if (unit === "rad") h = (h * 180) / Math.PI;
  else if (unit === "turn") h = h * 360;
  h = ((h % 360) + 360) % 360;

  const s = clamp(parseFloat(m[3]!) / 100, 0, 1);
  const l = clamp(parseFloat(m[4]!) / 100, 0, 1);
  let a = 1;
  if (m[5]) {
    const raw = m[5];
    a = clamp(raw.endsWith("%") ? parseFloat(raw) / 100 : parseFloat(raw), 0, 1);
  }
  const { r, g, b } = hslToRgb(h, s, l);
  return { r, g, b, a };
}

export function parseColor(value: string): RGB | null {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  if (NAMED_COLORS[trimmed]) return hexToRGB(NAMED_COLORS[trimmed]);
  if (trimmed.startsWith("#")) return hexToRGB(trimmed);
  if (trimmed.startsWith("rgb")) return parseRGBString(trimmed);
  if (trimmed.startsWith("hsl")) return parseHSLString(trimmed);
  return null;
}

export function relativeLuminance(color: RGB): number {
  const [rs, gs, bs] = [color.r / 255, color.g / 255, color.b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs! + 0.7152 * gs! + 0.0722 * bs!;
}

export function contrastRatio(fg: RGB, bg: RGB): number {
  const composedFg = composeOnto(fg, bg);
  const l1 = relativeLuminance(composedFg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Alpha-compose a translucent foreground onto an opaque background so that
 * contrast calculations reflect what users will actually see.
 */
function composeOnto(fg: RGB, bg: RGB): RGB {
  const a = fg.a ?? 1;
  if (a >= 1) return fg;
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
    a: 1,
  };
}

/**
 * Parse a CSS size value. Returns approximate pixels (1rem = 16px, 1em = 16px).
 * Returns null for relative units that require layout context (%, vw, vh).
 */
export function parseCSSSize(value: string): number | null {
  const m = value.trim().match(/^(-?[\d.]+)(px|rem|em|pt|pc|in|cm|mm|vw|vh|vmin|vmax|%)?$/i);
  if (!m) return null;
  const num = parseFloat(m[1]!);
  if (!Number.isFinite(num)) return null;
  const unit = (m[2] ?? "px").toLowerCase();
  switch (unit) {
    case "px":
      return num;
    case "rem":
    case "em":
      return num * 16;
    case "pt":
      return (num * 4) / 3;
    case "pc":
      return num * 16;
    case "in":
      return num * 96;
    case "cm":
      return (num * 96) / 2.54;
    case "mm":
      return (num * 96) / 25.4;
    default:
      return null;
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}
