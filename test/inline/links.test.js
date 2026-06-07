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

  it("Example 572: emphasis must not break shortcut reference label", () => {
    const markdown = "[foo*]: /url\n\n*[foo*]\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe('<p>*<a href="/url">foo*</a></p>\n');
  });

  it("Example 576: failed inline link falls back to shortcut reference", () => {
    const markdown = "[foo](not a link)\n\n[foo]: /url1\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe('<p><a href="/url1">foo</a>(not a link)</p>\n');
  });

  it("Example 577: unmatched full reference yields later full reference", () => {
    const markdown = "[foo][bar][baz]\n\n[baz]: /url\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe('<p>[foo]<a href="/url">bar</a></p>\n');
  });

  it("Example 578: multiple adjacent reference links", () => {
    const markdown = "[foo][bar][baz]\n\n[baz]: /url1\n[bar]: /url2\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe('<p><a href="/url2">foo</a><a href="/url1">baz</a></p>\n');
  });

  it("Example 579: prefer bar definition over foo when bar exists", () => {
    const markdown = "[foo][bar][baz]\n\n[baz]: /url1\n[foo]: /url2\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe('<p>[foo]<a href="/url1">bar</a></p>\n');
  });

  it("Example 511: destination percent-encoding and HTML entities", () => {
    const markdown = "[link](foo%20b&auml;)\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe('<p><a href="foo%20b%C3%A4">link</a></p>\n');
  });

  it("Example 514: title backslash and HTML entity unescaping", () => {
    const markdown = '[link](/url "title \\\"&quot;")\n';
    const { html } = transformer.render(markdown);
    expect(html).toBe('<p><a href="/url" title="title &quot;&quot;">link</a></p>\n');
  });

  it("Example 525: image inside link label", () => {
    const markdown = "[![moon](moon.jpg)](/uri)\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe('<p><a href="/uri"><img src="moon.jpg" alt="moon" /></a></p>\n');
  });

  it("Example 531: emphasis closes before unclosed bracket label", () => {
    const markdown = "*foo [bar* baz]\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe("<p><em>foo [bar</em> baz]</p>\n");
  });

  it("Example 539: image inside reference link label", () => {
    const markdown = "[![moon](moon.jpg)][ref]\n\n[ref]: /uri\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe('<p><a href="/uri"><img src="moon.jpg" alt="moon" /></a></p>\n');
  });

  it("Example 553: escaped punctuation in reference label does not match", () => {
    const markdown = "[bar][foo\\!]\n\n[foo!]: /url\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe("<p>[bar][foo!]</p>\n");
  });

  it("Example 549: multiline reference definition label", () => {
    const markdown = "[Foo\n  bar]: /url\n\n[Baz][Foo bar]\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe('<p><a href="/url">Baz</a></p>\n');
  });

  it("Example 560: whitespace-only link labels are invalid", () => {
    const markdown = "[\n ]\n\n[\n ]: /uri\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe("<p>[\n]</p>\n<p>[\n]: /uri</p>\n");
  });

  it("Example 554: unescaped bracket in reference label is invalid", () => {
    const markdown = "[foo][ref[]\n\n[ref[]: /uri\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe("<p>[foo][ref[]</p>\n<p>[ref[]: /uri</p>\n");
  });

  it("Example 555: nested brackets in reference label are invalid", () => {
    const markdown = "[foo][ref[bar]]\n\n[ref[bar]]: /uri\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe("<p>[foo][ref[bar]]</p>\n<p>[ref[bar]]: /uri</p>\n");
  });

  it("Example 556: shortcut label with nested brackets is invalid", () => {
    const markdown = "[[[foo]]]\n\n[[[foo]]]: /url\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe("<p>[[[foo]]]</p>\n<p>[[[foo]]]: /url</p>\n");
  });
});
