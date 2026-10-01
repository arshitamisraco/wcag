import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";

export type FixInput = { selector: string; fixCode: string };
export type FixFailure = { selector: string; reason: string };
export type ApplyResult = { html: string; applied: number; failed: FixFailure[] };

const DOC_ROOTS = new Set(["html", "head", "body", "title"]);

function isElement(node: AnyNode): node is Element {
  return node.type === "tag" || node.type === "script" || node.type === "style";
}

/** Parse fixCode into exactly one top-level element, or return an error string. */
function parseFix(fixCode: string): { root: Element } | { error: string } {
  const code = fixCode.trim();
  if (!code) return { error: "fixCode is empty" };
  const first = /^(?:<!doctype[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<([a-zA-Z][\w-]*)/i.exec(code)?.[1]?.toLowerCase();
  const $ = DOC_ROOTS.has(first ?? "") ? cheerio.load(code) : cheerio.load(code, null, false);
  
  if (first && DOC_ROOTS.has(first)) {
    const found = $(first).toArray();
    if (found.length !== 1) return { error: `fixCode must contain exactly one <${first}> element` };
    return { root: found[0] as Element };
  }
  const top: AnyNode[] = $.root().contents().toArray();
  const elements = top.filter(isElement);
  const stray = top.filter((n) => n.type === "text" && /\S/.test((n as { data: string }).data));
  if (elements.length === 0) return { error: "fixCode contains no element" };
  if (elements.length > 1) return { error: "fixCode contains more than one top-level element" };
  if (stray.length > 0) return { error: "fixCode contains stray text outside its root element" };
  return { root: elements[0] };
}

/**
 * Apply AI-suggested fixes to an HTML document. Each fix replaces the single element
 * matched by `selector` with `fixCode`. Fixes are applied in document order.
 * `html`/`head`/`body` targets merge attributes; a `<title>` fix upserts the title.
 */
export function applyFixes(html: string, fixes: FixInput[]): ApplyResult {
  const $ = cheerio.load(html);
  const failed: FixFailure[] = [];
  const all = $("*").toArray();
  const order = new Map<AnyNode, number>(all.map((el, i) => [el, i]));

  type Resolved = { fix: FixInput; el: Element; root: Element; idx: number };
  const resolved: Resolved[] = [];
  const fail = (selector: string, reason: string) => failed.push({ selector, reason });

  for (const fix of fixes) {
    const selector = fix.selector;
    let matches: Element[];
    try {
      matches = $(selector).toArray() as Element[];
    } catch (e) {
      fail(selector, `invalid selector: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }
    if (matches.length === 0) {
      fail(selector, "selector matched no elements (multi-frame selectors are not supported)");
      continue;
    }
    if (matches.length > 1) {
      fail(selector, `selector matched ${matches.length} elements`);
      continue;
    }
    const parsed = parseFix(fix.fixCode);
    if ("error" in parsed) {
      fail(selector, parsed.error);
      continue;
    }
    resolved.push({ fix, el: matches[0], root: parsed.root, idx: order.get(matches[0]) ?? 0 });
  }

  resolved.sort((a, b) => a.idx - b.idx);
  let applied = 0;
  const replaced = new Set<AnyNode>();

  for (const { fix, el, root } of resolved) {
    // Skip if an ancestor was already replaced (the element is now detached).
    let detached = false;
    for (let p: AnyNode | null = el; p; p = p.parent) {
      if (replaced.has(p)) {
        detached = true;
        break;
      }
    }
    if (detached) {
      fail(fix.selector, "element was inside an element already replaced by another fix");
      continue;
    }
    const target = el.name.toLowerCase();
    const rootName = root.name.toLowerCase();

    if (rootName === "title" && (target === "html" || target === "head" || target === "title")) {
      const titleText = $(root).text();
      let title = $("title").first();
      if (title.length === 0) {
        let head = $("head").first();
        if (head.length === 0) {
          $("html").first().prepend("<head></head>");
          head = $("head").first();
        }
        head.prepend("<title></title>");
        title = $("title").first();
      }
      title.text(titleText);
      applied++;
    } else if (target === "html" || target === "head" || target === "body") {
      if (rootName !== target) {
        fail(fix.selector, `cannot replace <${target}> with <${rootName}>; only attribute merges are supported`);
        continue;
      }
      for (const [k, v] of Object.entries(root.attribs)) $(el).attr(k, v);
      applied++;
    } else {
      $(el).replaceWith(fix.fixCode.trim());
      replaced.add(el);
      applied++;
    }
  }

  return { html: $.html(), applied, failed };
}
