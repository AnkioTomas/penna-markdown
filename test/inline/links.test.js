import { describe, expect, it } from "vitest";
import { createTransformer } from "../../src/transformer/index.js";

describe("inline/links", () => {
  const transformer = createTransformer();

  it("Example 493: Inline link with title", () => {
    const markdown = '[link](/uri "title")';
    const { html } = transformer.render(markdown);
    expect(html.trim()).toBe('<p><a href="/uri" title="title">link</a></p>');
  });

  it("Example 494: Inline link without title", () => {
    const markdown = "[link](/uri)";
    const { html } = transformer.render(markdown);
    expect(html.trim()).toBe('<p><a href="/uri">link</a></p>');
  });

  it("Example 496: Inline link with empty brackets", () => {
    const markdown = "[link](<>)";
    const { html } = transformer.render(markdown);
    expect(html.trim()).toBe('<p><a href="">link</a></p>');
  });

  it("Example 525: Inline image", () => {
    const markdown = "![alt](moon.jpg)";
    const { html } = transformer.render(markdown);
    expect(html.trim()).toBe('<p><img src="moon.jpg" alt="alt" /></p>');
  });

  it("Example 535: Reference link", () => {
    const markdown = '[foo][bar]\n\n[bar]: /url "title"';
    const { html } = transformer.render(markdown);
    expect(html.trim()).toBe('<p><a href="/url" title="title">foo</a></p>');
  });

  it("Example 561: Collapsed reference link", () => {
    const markdown = '[foo][]\n\n[foo]: /url "title"';
    const { html } = transformer.render(markdown);
    expect(html.trim()).toBe('<p><a href="/url" title="title">foo</a></p>');
  });

  it("Example 565: Shortcut reference link", () => {
    const markdown = '[foo]\n\n[foo]: /url "title"';
    const { html } = transformer.render(markdown);
    expect(html.trim()).toBe('<p><a href="/url" title="title">foo</a></p>');
  });

  it("Example 502: escaped closing bracket invalidates angle destination", () => {
    const markdown = "[link](<foo\\>)\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe("<p>[link](&lt;foo&gt;)</p>\n");
  });

  it("Example 504: escaped parentheses in destination", () => {
    const markdown = "[link](\\(foo\\))\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe('<p><a href="(foo)">link</a></p>\n');
  });

  it("Example 506: unbalanced parentheses with escapes", () => {
    const markdown = "[link](foo\\(and\\(bar\\))\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe('<p><a href="foo(and(bar)">link</a></p>\n');
  });

  it("Example 508: escaped closing paren and colon", () => {
    const markdown = "[link](foo\\)\\:)\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe('<p><a href="foo):">link</a></p>\n');
  });

  it("Example 318: backslash escapes in inline link destination and title", () => {
    const markdown = '[foo](/bar\\* "ti\\*tle")\n';
    const { html } = transformer.render(markdown);
    expect(html).toBe('<p><a href="/bar*" title="ti*tle">foo</a></p>\n');
  });
});
