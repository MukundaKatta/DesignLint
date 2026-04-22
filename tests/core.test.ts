import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { DesignLinter } from "../src/core.js";
import { applyFixes } from "../src/fix.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => readFileSync(resolve(__dirname, "fixtures", name), "utf8");

describe("DesignLinter - fixtures", () => {
  it("clean.html produces no issues and score 100", () => {
    const report = new DesignLinter().lint(fixture("clean.html"));
    assert.deepEqual(report.issues, []);
    assert.equal(report.score, 100);
  });

  it("dirty.html flags every target rule", () => {
    const report = new DesignLinter().lint(fixture("dirty.html"));
    const ids = new Set(report.issues.map((i) => i.id));
    for (const expected of [
      "color-contrast",
      "font-size-minimum",
      "heading-hierarchy",
      "image-alt-text",
      "link-rel-noopener",
      "form-label",
      "button-size",
      "duplicate-id",
      "spacing-consistency",
    ]) {
      assert.ok(ids.has(expected), `expected ${expected} to be reported`);
    }
    assert.ok(report.score < 50, `score should reflect many issues, got ${report.score}`);
  });

  it("style-block.html detects issues from <style> rules", () => {
    const report = new DesignLinter().lint(fixture("style-block.html"));
    const ids = report.issues.map((i) => i.id);
    assert.ok(ids.includes("color-contrast"));
    assert.ok(ids.includes("font-size-minimum"));
    assert.ok(ids.includes("button-size"));
  });
});

describe("DesignLinter - rules", () => {
  it("does not flag images marked decorative via role", () => {
    const html = `<img src="bg.png" role="presentation">`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "image-alt-text").length, 0);
  });

  it("does not flag aria-hidden images", () => {
    const html = `<img src="bg.png" aria-hidden="true">`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "image-alt-text").length, 0);
  });

  it("accepts label via aria-label", () => {
    const html = `<input type="text" aria-label="Search">`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "form-label").length, 0);
  });

  it("accepts label wrapping input", () => {
    const html = `<label>Email <input type="email"></label>`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "form-label").length, 0);
  });

  it("accepts rel=noreferrer alone on target=_blank", () => {
    const html = `<a href="x" target="_blank" rel="noreferrer">x</a>`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "link-rel-noopener").length, 0);
  });

  it("uses large-text contrast threshold for bold/large text", () => {
    const html = `<p style="color: #767676; background-color: #fff; font-size: 20px; font-weight: 700">Bold, large, low-ish.</p>`;
    const report = new DesignLinter().lint(html);
    const contrastIssues = report.issues.filter((i) => i.id === "color-contrast");
    assert.equal(contrastIssues.length, 0, "#767676 on #fff passes AA large-text");
  });

  it("respects alpha in rgba color contrast", () => {
    const html = `<p style="color: rgba(0, 0, 0, 0.2); background-color: #fff">Faint.</p>`;
    const report = new DesignLinter().lint(html);
    assert.ok(report.issues.some((i) => i.id === "color-contrast"));
  });

  it("disables rule when severity is off", () => {
    const html = `<img src="x.png">`;
    const linter = new DesignLinter({
      rules: { imageAltText: { enabled: true, severity: "off" } },
    });
    const report = linter.lint(html);
    assert.equal(report.issues.filter((i) => i.id === "image-alt-text").length, 0);
  });
});

describe("Autofix", () => {
  it("adds alt='' role='presentation' on bare <img>", () => {
    const html = `<img src="a.png">`;
    const { issues } = new DesignLinter().lint(html);
    const { output, appliedCount } = applyFixes(html, issues);
    assert.ok(output.includes(`alt=""`) && output.includes(`role="presentation"`));
    assert.equal(appliedCount, 1);
  });

  it("inserts viewport meta in full documents", () => {
    const html = `<!doctype html><html><head><title>T</title></head><body></body></html>`;
    const { issues } = new DesignLinter().lint(html);
    const { output } = applyFixes(html, issues);
    assert.ok(output.includes(`name="viewport"`));
  });

  it("adds rel='noopener noreferrer' to target=_blank without rel", () => {
    const html = `<a href="x" target="_blank">x</a>`;
    const { issues } = new DesignLinter().lint(html);
    const { output } = applyFixes(html, issues);
    assert.ok(output.includes(`rel="noopener noreferrer"`));
  });

  it("extends existing rel attribute without clobbering", () => {
    const html = `<a href="x" target="_blank" rel="nofollow">x</a>`;
    const { issues } = new DesignLinter().lint(html);
    const { output } = applyFixes(html, issues);
    assert.ok(output.includes(`rel="nofollow noopener noreferrer"`));
  });

  it("running autofix twice is idempotent (no new fixes)", () => {
    const html = `<img src="a.png">`;
    const linter = new DesignLinter();
    const first = applyFixes(html, linter.lint(html).issues).output;
    const second = applyFixes(first, linter.lint(first).issues);
    assert.equal(second.appliedCount, 0);
    assert.equal(first, second.output);
  });
});
