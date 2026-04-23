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

describe("DesignLinter - new rules", () => {
  it("html-has-lang fires on <html> without lang", () => {
    const html = `<!doctype html><html><head><title>T</title></head><body></body></html>`;
    const report = new DesignLinter().lint(html);
    assert.ok(report.issues.some((i) => i.id === "html-has-lang"));
  });

  it("html-has-lang quiet with lang='en'", () => {
    const html = `<!doctype html><html lang="en"><head><title>T</title></head><body></body></html>`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "html-has-lang").length, 0);
  });

  it("html-has-lang accepts xml:lang fallback", () => {
    const html = `<!doctype html><html xml:lang="fr"><head><title>T</title></head><body></body></html>`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "html-has-lang").length, 0);
  });

  it("page-title fires when <title> is empty", () => {
    const html = `<!doctype html><html lang="en"><head><title>   </title></head><body></body></html>`;
    const report = new DesignLinter().lint(html);
    assert.ok(report.issues.some((i) => i.id === "page-title"));
  });

  it("page-title fires when <title> is missing", () => {
    const html = `<!doctype html><html lang="en"><head></head><body></body></html>`;
    const report = new DesignLinter().lint(html);
    assert.ok(report.issues.some((i) => i.id === "page-title"));
  });

  it("viewport-meta flags user-scalable=no", () => {
    const html = `<!doctype html><html lang="en"><head><title>T</title><meta name="viewport" content="width=device-width, user-scalable=no"></head><body></body></html>`;
    const report = new DesignLinter().lint(html);
    const vp = report.issues.filter((i) => i.id === "viewport-meta");
    assert.ok(vp.length > 0 && vp.some((i) => /user-scalable/.test(i.message)));
  });

  it("viewport-meta flags maximum-scale=1", () => {
    const html = `<!doctype html><html lang="en"><head><title>T</title><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"></head><body></body></html>`;
    const report = new DesignLinter().lint(html);
    assert.ok(report.issues.some((i) => i.id === "viewport-meta" && /maximum-scale/.test(i.message)));
  });

  it("image-alt-text flags <input type=image> with no alt", () => {
    const html = `<input type="image" src="go.png">`;
    const report = new DesignLinter().lint(html);
    assert.ok(report.issues.some((i) => i.id === "image-alt-text"));
  });

  it("image-alt-text flags junk alt (filename-like)", () => {
    const html = `<img src="hero.png" alt="hero.png">`;
    const report = new DesignLinter().lint(html);
    assert.ok(report.issues.some((i) => i.id === "image-alt-text"));
  });

  it("image-alt-text flags generic alt 'image'", () => {
    const html = `<img src="a.png" alt="image">`;
    const report = new DesignLinter().lint(html);
    assert.ok(report.issues.some((i) => i.id === "image-alt-text"));
  });

  it("image-alt-text quiet with descriptive alt", () => {
    const html = `<img src="hero.png" alt="Sunset over the Grand Canyon">`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "image-alt-text").length, 0);
  });

  it("image-alt-text accepts aria-label in place of alt", () => {
    const html = `<img src="go.png" aria-label="Start tour">`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "image-alt-text").length, 0);
  });
});

describe("color-contrast - ancestor resolution", () => {
  it("resolves background from ancestor when not set on the element itself", () => {
    const html = `<div style="background-color: #333"><p style="color: #555">hi</p></div>`;
    const report = new DesignLinter().lint(html);
    assert.ok(
      report.issues.some((i) => i.id === "color-contrast"),
      "should flag dark text on dark background even though bg is on parent"
    );
  });

  it("does not fire when author never sets color", () => {
    const html = `<div style="background-color: #000"><p>no color set</p></div>`;
    const report = new DesignLinter().lint(html);
    assert.equal(
      report.issues.filter((i) => i.id === "color-contrast").length,
      0,
      "author didn't declare a color — not their bug"
    );
  });

  it("falls back to white background when no ancestor sets one", () => {
    const html = `<p style="color: #ccc">light on default</p>`;
    const report = new DesignLinter().lint(html);
    assert.ok(report.issues.some((i) => i.id === "color-contrast"));
  });
});

describe("empty-heading", () => {
  it("flags <h2></h2>", () => {
    const html = `<h2></h2>`;
    const report = new DesignLinter().lint(html);
    assert.ok(report.issues.some((i) => i.id === "empty-heading"));
  });

  it("flags <h2>   </h2> (whitespace only)", () => {
    const html = `<h2>   </h2>`;
    const report = new DesignLinter().lint(html);
    assert.ok(report.issues.some((i) => i.id === "empty-heading"));
  });

  it("flags <h2> wrapping image with no alt", () => {
    const html = `<h2><img src="logo.png"></h2>`;
    const report = new DesignLinter().lint(html);
    assert.ok(report.issues.some((i) => i.id === "empty-heading"));
  });

  it("quiet on <h2> wrapping image with alt", () => {
    const html = `<h2><img src="logo.png" alt="Acme Corp"></h2>`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "empty-heading").length, 0);
  });

  it("quiet when aria-label is set on the heading itself", () => {
    const html = `<h2 aria-label="Section title"></h2>`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "empty-heading").length, 0);
  });

  it("quiet with normal text content", () => {
    const html = `<h2>About Us</h2>`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "empty-heading").length, 0);
  });
});

describe("button-type", () => {
  it("flags <button> inside <form> without type", () => {
    const html = `<form><button>Click</button></form>`;
    const report = new DesignLinter().lint(html);
    assert.ok(report.issues.some((i) => i.id === "button-type"));
  });

  it("quiet with type=button", () => {
    const html = `<form><button type="button">Click</button></form>`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "button-type").length, 0);
  });

  it("quiet with type=submit (explicit is fine)", () => {
    const html = `<form><button type="submit">Submit</button></form>`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "button-type").length, 0);
  });

  it("quiet outside <form>", () => {
    const html = `<div><button>Click</button></div>`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "button-type").length, 0);
  });

  it("autofix inserts type='button'", () => {
    const html = `<form><button>Click</button></form>`;
    const { issues } = new DesignLinter().lint(html);
    const { output } = applyFixes(html, issues);
    assert.ok(/<button\s+type="button">/.test(output), `expected type inserted, got: ${output}`);
  });
});

describe("label-for-valid", () => {
  it("flags <label for=id> pointing at nothing", () => {
    const html = `<label for="nope">Email</label>`;
    const report = new DesignLinter().lint(html);
    assert.ok(report.issues.some((i) => i.id === "label-for-valid"));
  });

  it("flags <label for=id> pointing at a non-form element", () => {
    const html = `<label for="hdr">Title</label><h2 id="hdr">Hi</h2>`;
    const report = new DesignLinter().lint(html);
    assert.ok(report.issues.some((i) => i.id === "label-for-valid"));
  });

  it("quiet when <label for=id> points at a real input", () => {
    const html = `<label for="email">Email</label><input id="email" type="email">`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "label-for-valid").length, 0);
  });

  it("flags duplicate labels for the same id", () => {
    const html = `<label for="x">A</label><label for="x">B</label><input id="x">`;
    const report = new DesignLinter().lint(html);
    assert.ok(report.issues.some((i) => i.id === "label-for-valid" && /Multiple/.test(i.message)));
  });
});

describe("iframe-title", () => {
  it("flags iframe without title", () => {
    const html = `<iframe src="https://example.com"></iframe>`;
    const report = new DesignLinter().lint(html);
    assert.ok(report.issues.some((i) => i.id === "iframe-title"));
  });

  it("quiet with title", () => {
    const html = `<iframe src="x" title="Demo"></iframe>`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "iframe-title").length, 0);
  });

  it("quiet with aria-label", () => {
    const html = `<iframe src="x" aria-label="Demo"></iframe>`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "iframe-title").length, 0);
  });

  it("quiet when aria-hidden=true", () => {
    const html = `<iframe src="x" aria-hidden="true"></iframe>`;
    const report = new DesignLinter().lint(html);
    assert.equal(report.issues.filter((i) => i.id === "iframe-title").length, 0);
  });
});

describe("Autofix", () => {
  it("inserts lang='en' on <html> without lang", () => {
    const html = `<!doctype html><html><head><title>T</title></head><body></body></html>`;
    const { issues } = new DesignLinter().lint(html);
    const { output } = applyFixes(html, issues);
    assert.ok(/<html\s+lang="en">/.test(output), `expected lang inserted, got: ${output}`);
  });


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
