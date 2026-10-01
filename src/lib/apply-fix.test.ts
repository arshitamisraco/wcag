import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyFixes } from "./apply-fix";

const DOC = `<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <img id="a" src="x.png">
  <p class="dup">one</p>
  <p class="dup">two</p>
  <button id="b"></button>
</body>
</html>`;

describe("applyFixes", () => {
  it("replaces a matched element", () => {
    const r = applyFixes(DOC, [{ selector: "#a", fixCode: '<img id="a" src="x.png" alt="Logo">' }]);
    assert.equal(r.applied, 1);
    assert.deepEqual(r.failed, []);
    assert.match(r.html, /<img id="a" src="x.png" alt="Logo">/);
  });

  it("merges attributes onto <html> without replacing the document", () => {
    const r = applyFixes(DOC, [{ selector: "html", fixCode: '<html lang="en"></html>' }]);
    assert.equal(r.applied, 1);
    assert.match(r.html, /<html lang="en">/);
    assert.match(r.html, /<button id="b">/);
    assert.match(r.html, /<!DOCTYPE html>/i);
  });

  it("inserts a title when none exists", () => {
    const r = applyFixes(DOC, [{ selector: "html", fixCode: "<title>My page</title>" }]);
    assert.equal(r.applied, 1);
    assert.match(r.html, /<title>My page<\/title>/);
  });

  it("replaces an existing title", () => {
    const withTitle = DOC.replace("<head>", "<head><title>Old</title>");
    const r = applyFixes(withTitle, [{ selector: "html", fixCode: "<title>New</title>" }]);
    assert.match(r.html, /<title>New<\/title>/);
    assert.doesNotMatch(r.html, /Old/);
  });

  it("records failure when the selector is not found", () => {
    const r = applyFixes(DOC, [{ selector: "#nope", fixCode: "<div></div>" }]);
    assert.equal(r.applied, 0);
    assert.equal(r.failed.length, 1);
    assert.equal(r.failed[0].selector, "#nope");
  });

  it("rejects invalid fixCode and leaves the original", () => {
    const empty = applyFixes(DOC, [{ selector: "#a", fixCode: "just text" }]);
    const two = applyFixes(DOC, [{ selector: "#a", fixCode: "<b>1</b><i>2</i>" }]);
    for (const r of [empty, two]) {
      assert.equal(r.applied, 0);
      assert.equal(r.failed.length, 1);
      assert.match(r.html, /<img id="a" src="x.png">/);
    }
  });

  it("fails when the selector matches multiple elements", () => {
    const r = applyFixes(DOC, [{ selector: "p.dup", fixCode: "<p>x</p>" }]);
    assert.equal(r.applied, 0);
    assert.match(r.failed[0].reason, /2 elements/);
  });

  it("applies several fixes deterministically in document order", () => {
    const fixes = [
      { selector: "#b", fixCode: '<button id="b">Go</button>' },
      { selector: "#a", fixCode: '<img id="a" src="x.png" alt="A">' },
    ];
    const r1 = applyFixes(DOC, fixes);
    const r2 = applyFixes(DOC, [...fixes].reverse());
    assert.equal(r1.applied, 2);
    assert.equal(r1.html, r2.html);
  });
});
