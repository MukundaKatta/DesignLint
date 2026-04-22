import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hexToRGB,
  parseColor,
  parseRGBString,
  parseHSLString,
  contrastRatio,
  parseCSSSize,
} from "../src/utils.js";

describe("parseColor", () => {
  it("parses 3- and 6-digit hex", () => {
    assert.deepEqual(hexToRGB("#fff")!, { r: 255, g: 255, b: 255, a: 1 });
    assert.deepEqual(hexToRGB("#000000")!, { r: 0, g: 0, b: 0, a: 1 });
  });

  it("parses rgba", () => {
    const c = parseRGBString("rgba(10, 20, 30, 0.5)")!;
    assert.equal(c.r, 10);
    assert.equal(c.g, 20);
    assert.equal(c.b, 30);
    assert.equal(c.a, 0.5);
  });

  it("parses hsl", () => {
    const c = parseHSLString("hsl(0, 100%, 50%)")!;
    assert.equal(c.r, 255);
    assert.equal(c.g, 0);
    assert.equal(c.b, 0);
  });

  it("parses named colors", () => {
    assert.deepEqual(parseColor("white")!, { r: 255, g: 255, b: 255, a: 1 });
    assert.deepEqual(parseColor("rebeccapurple")!, { r: 102, g: 51, b: 153, a: 1 });
  });

  it("treats transparent as a=0", () => {
    const t = parseColor("transparent")!;
    assert.equal(t.a, 0);
  });
});

describe("contrastRatio", () => {
  it("black on white is 21", () => {
    const r = contrastRatio(
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 }
    );
    assert.ok(Math.abs(r - 21) < 0.01);
  });

  it("same color is 1", () => {
    const r = contrastRatio(
      { r: 128, g: 128, b: 128 },
      { r: 128, g: 128, b: 128 }
    );
    assert.equal(Math.round(r), 1);
  });

  it("alpha-composes foreground onto background", () => {
    const r = contrastRatio(
      { r: 0, g: 0, b: 0, a: 0.1 },
      { r: 255, g: 255, b: 255 }
    );
    assert.ok(r < 1.5, `near-transparent black on white should be low, got ${r}`);
  });
});

describe("parseCSSSize", () => {
  it("returns px for px values", () => {
    assert.equal(parseCSSSize("16px"), 16);
    assert.equal(parseCSSSize("-4px"), -4);
  });

  it("converts rem/em at 16px root", () => {
    assert.equal(parseCSSSize("1rem"), 16);
    assert.equal(parseCSSSize("0.75em"), 12);
  });

  it("converts pt and in", () => {
    assert.equal(parseCSSSize("12pt"), 16);
    assert.equal(parseCSSSize("1in"), 96);
  });

  it("returns null for relative-to-viewport units", () => {
    assert.equal(parseCSSSize("50vw"), null);
    assert.equal(parseCSSSize("50%"), null);
  });
});
