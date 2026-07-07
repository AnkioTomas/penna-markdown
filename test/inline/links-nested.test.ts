import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

describe("inline/links nested precedence", () => {
  const transformer = createEngine();

  it("Example 526: nested links use inner-most only", () => {
    const markdown = "[foo [bar](/uri)](/uri)\n";
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe('<p>[foo <a href="/uri">bar</a>](/uri)</p>\n');
  });

  it("Example 527: nested links with emphasis", () => {
    const markdown = "[foo *[bar [baz](/uri)](/uri)*](/uri)\n";
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe(
      '<p>[foo <em>[bar <a href="/uri">baz</a>](/uri)</em>](/uri)</p>\n',
    );
  });

  it("Example 528: nested links in image alt", () => {
    const markdown = "![[[foo](uri1)](uri2)](uri3)\n";
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe(
      '<p><img src="uri3" alt="[foo](uri2)" loading="lazy" /></p>\n',
    );
  });

  it("Example 529: link text binds tighter than emphasis", () => {
    const markdown = "*[foo*](/uri)\n";
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe('<p>*<a href="/uri">foo*</a></p>\n');
  });

  it("Example 532: raw HTML in link text prevents link", () => {
    const markdown = '[foo <bar attr="](baz)">\n';
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe('<p>[foo <bar attr="](baz)"></p>\n');
  });

  it("Example 533: code span in link text prevents link", () => {
    const markdown = "[foo`](/uri)`\n";
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe("<p>[foo<code>](/uri)</code></p>\n");
  });

  it("Example 534: autolink in link text", () => {
    const markdown = "[foo<http://example.com/?search=](uri)>\n";
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe(
      '<p>[foo<a href="http://example.com/?search=%5D(uri)">http://example.com/?search=](uri)</a></p>\n',
    );
  });
});
