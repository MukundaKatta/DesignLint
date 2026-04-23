import type { Rule } from "./types.js";
import { colorContrast } from "./color-contrast.js";
import { fontSizeMinimum } from "./font-size.js";
import { spacingConsistency } from "./spacing.js";
import { buttonSize } from "./button-size.js";
import { headingHierarchy } from "./heading-hierarchy.js";
import { imageAltText } from "./image-alt.js";
import { viewportMeta } from "./viewport-meta.js";
import { linkRelNoopener } from "./link-rel-noopener.js";
import { formLabel } from "./form-label.js";
import { duplicateId } from "./duplicate-id.js";
import { responsiveImages } from "./responsive-images.js";
import { htmlHasLang } from "./html-has-lang.js";
import { pageTitle } from "./page-title.js";

export const ALL_RULES: Rule[] = [
  colorContrast,
  fontSizeMinimum,
  spacingConsistency,
  buttonSize,
  headingHierarchy,
  imageAltText,
  viewportMeta,
  linkRelNoopener,
  formLabel,
  duplicateId,
  responsiveImages,
  htmlHasLang,
  pageTitle,
];

export const RULE_META: Array<{ id: string; key: keyof import("../config.js").RuleConfigs; summary: string }> = [
  { id: "color-contrast", key: "colorContrast", summary: "Flag color/background pairs below WCAG AA contrast." },
  { id: "font-size-minimum", key: "fontSizeMinimum", summary: "Flag text below the configured minimum px size." },
  { id: "spacing-consistency", key: "spacingConsistency", summary: "Warn when margin/padding isn't on the base-unit grid." },
  { id: "button-size", key: "buttonSize", summary: "Check interactive touch targets meet WCAG 2.5.5 (44x44)." },
  { id: "heading-hierarchy", key: "headingHierarchy", summary: "Headings must start at h1 and not skip levels." },
  { id: "image-alt-text", key: "imageAltText", summary: "Images need descriptive alt (and image-buttons must have labels)." },
  { id: "viewport-meta", key: "viewportMeta", summary: "Require a responsive viewport and disallow zoom lockouts." },
  { id: "link-rel-noopener", key: "linkRelNoopener", summary: "target=\"_blank\" links need rel=\"noopener\" (tabnabbing)." },
  { id: "form-label", key: "formLabel", summary: "Every form control needs a label or aria-label." },
  { id: "duplicate-id", key: "duplicateId", summary: "IDs must be unique within a document." },
  { id: "responsive-images", key: "responsiveImages", summary: "Flag <img> missing srcset/sizes/loading on large images." },
  { id: "html-has-lang", key: "htmlHasLang", summary: "<html> must declare a lang attribute." },
  { id: "page-title", key: "pageTitle", summary: "Full documents need a non-empty <title>." },
];

export * from "./types.js";
