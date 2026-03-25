import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DesignLinter } from "../src/core.js";
import { hexToRGB, contrastRatio, parseCSSSize } from "../src/utils.js";

describe("DesignLinter", () => {
  const linter = new DesignLinter();

  it("should detect missing alt text on images", () => {
    const html = `<img src="hero.png"><img src="logo.png" alt="">`;
    const report = linter.lint(html);
    const altIssues = report.issues.filter((i) => i.id === "image-alt-text");
    assert.equal(altIssues.length, 2, "Should flag both images without meaningful alt");
    assert.equal(altIssues[0].severity, "error");
  });

  it("should detect low color contrast", () => {
    // light gray text on white background — ratio ~1.07:1
    const html = `<p style="color: #eeeeee; background-color: #ffffff">Low contrast</p>`;
    const report = linter.lint(html);
    const contrastIssues = report.issues.filter((i) => i.id === "color-contrast");
    assert.equal(contrastIssues.length, 1);
    assert.equal(contrastIssues[0].severity, "error");
  });

  it("should detect heading hierarchy violations", () => {
    const html = `<h1>Title</h1><h3>Subsection</h3>`;
    const report = linter.lint(html);
    const headingIssues = report.issues.filter((i) => i.id === "heading-hierarchy");
    assert.equal(headingIssues.length, 1);
    assert.ok(headingIssues[0].message.includes("skips level"));
  });

  it("should detect missing viewport meta in full documents", () => {
    const html = `<html><head><title>Test</title></head><body></body></html>`;
    const report = linter.lint(html);
    const vpIssues = report.issues.filter((i) => i.id === "viewport-meta");
    assert.equal(vpIssues.length, 1);
  });

  it("should detect font size below minimum", () => {
    const html = `<span style="font-size: 10px">Tiny text</span>`;
    const report = linter.lint(html);
    const fontIssues = report.issues.filter((i) => i.id === "font-size-minimum");
    assert.equal(fontIssues.length, 1);
    assert.ok(fontIssues[0].message.includes("10px"));
  });

  it("should return a perfect score for clean HTML", () => {
    const html = `<img src="photo.jpg" alt="A sunset over the ocean">`;
    const report = linter.lint(html);
    assert.equal(report.issues.length, 0);
    assert.equal(report.score, 100);
  });

  it("should detect small button touch targets", () => {
    const html = `<button style="width: 30px; height: 30px">X</button>`;
    const report = linter.lint(html);
    const btnIssues = report.issues.filter((i) => i.id === "button-size");
    assert.ok(btnIssues.length >= 1, "Should flag small button");
  });

  it("should respect custom rule configuration", () => {
    const custom = new DesignLinter({
      rules: { imageAltText: { enabled: false, severity: "error" } } as any,
    });
    const html = `<img src="test.png">`;
    const report = custom.lint(html);
    const altIssues = report.issues.filter((i) => i.id === "image-alt-text");
    assert.equal(altIssues.length, 0, "Disabled rule should not produce issues");
  });
});

describe("Utils", () => {
  it("should parse hex colors correctly", () => {
    const white = hexToRGB("#fff")!;
    assert.deepEqual(white, { r: 255, g: 255, b: 255 });
    const black = hexToRGB("#000000")!;
    assert.deepEqual(black, { r: 0, g: 0, b: 0 });
  });

  it("should calculate contrast ratio for black on white", () => {
    const ratio = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
    assert.ok(ratio > 20, `Expected ratio > 20, got ${ratio}`);
  });

  it("should parse CSS sizes", () => {
    assert.equal(parseCSSSize("16px"), 16);
    assert.equal(parseCSSSize("1rem"), 16);
    assert.equal(parseCSSSize("0.75em"), 12);
    assert.equal(parseCSSSize("12pt"), 16);
  });
});
