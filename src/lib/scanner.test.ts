import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";

process.env.ALLOW_PRIVATE_URLS = "1";
process.env.CHROMIUM_EXECUTABLE_PATH ||= "/opt/pw-browsers/chromium";

import { flattenViolations, scanUrl } from "./scanner";
import { normalizeUrl, assertScannableUrl, InvalidUrlError } from "./url";

const FIXTURE = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Fixture</title></head>
<body>
  <main>
    <h1>Fixture page</h1>
    <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">
    <button></button>
    <p style="color:#bbbbbb;background:#ffffff">Low contrast text</p>
  </main>
</body>
</html>`;

const server = createServer((_req, res) => {
  res.writeHead(200, { "content-type": "text/html" });
  res.end(FIXTURE);
});
let baseUrl = "";

before(async () => {
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
});
after(() => {
  server.close();
});

describe("scanUrl", { skip: !existsSync(process.env.CHROMIUM_EXECUTABLE_PATH!) }, () => {
  it("finds known violations in the fixture", { timeout: 60000 }, async () => {
    const result = await scanUrl(baseUrl);
    const ids = result.violations.map((v) => v.id);
    for (const id of ["image-alt", "button-name", "html-has-lang"]) {
      assert.ok(ids.includes(id), `expected ${id} in ${ids.join(",")}`);
    }
    assert.ok(ids.includes("color-contrast"), "expected color-contrast");
    assert.equal(result.title, "Fixture");
    assert.equal(result.summary.violations, result.violations.length);
    const flat = flattenViolations(result.violations);
    assert.ok(flat.length >= result.violations.length);
    const img = flat.find((f) => f.ruleId === "image-alt")!;
    assert.match(img.html, /<img/);
    assert.ok(img.wcagTags.every((t) => t.startsWith("wcag")));
    assert.ok(img.wcagTags.includes("wcag111"));
    assert.ok(img.selector.length > 0);
  });
});

describe("url validation", () => {
  it("normalizes", () => {
    assert.equal(normalizeUrl("Example.COM/a#frag"), "https://example.com/a");
    assert.throws(() => normalizeUrl("ftp://x.com"), InvalidUrlError);
  });
  it("rejects private addresses unless allowed", async () => {
    process.env.ALLOW_PRIVATE_URLS = "";
    try {
      await assert.rejects(assertScannableUrl("http://localhost:3000"), InvalidUrlError);
      await assert.rejects(assertScannableUrl("http://192.168.1.5"), InvalidUrlError);
      await assert.rejects(assertScannableUrl("http://[::1]/"), InvalidUrlError);
    } finally {
      process.env.ALLOW_PRIVATE_URLS = "1";
    }
  });
});
