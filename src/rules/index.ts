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
];

export * from "./types.js";
