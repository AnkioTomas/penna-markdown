import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

describe("inline/images", () => {
  const transformer = createEngine();

  it("Example 581: shortcut reference image with emphasis in alt", () => {
    const markdown = '![foo *bar*]\n\n[foo *bar*]: train.jpg "train & tracks"\n';
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe(
      '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>\n',
    );
  });

  it("Example 582: nested image in alt text", () => {
    const markdown = "![foo ![bar](/url)](/url2)\n";
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe('<p><img src="/url2" alt="foo bar" /></p>\n');
  });

  it("Example 583: nested link in alt text", () => {
    const markdown = "![foo [bar](/url)](/url2)\n";
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe('<p><img src="/url2" alt="foo bar" /></p>\n');
  });

  it("Example 584: collapsed reference image", () => {
    const markdown = '![foo *bar*][]\n\n[foo *bar*]: train.jpg "train & tracks"\n';
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe(
      '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>\n',
    );
  });

  it("Example 585: full reference image with case-insensitive label", () => {
    const markdown = '![foo *bar*][foobar]\n\n[FOOBAR]: train.jpg "train & tracks"\n';
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe(
      '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>\n',
    );
  });

  it("Example 590: full reference image", () => {
    const markdown = "![foo][bar]\n\n[bar]: /url\n";
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe('<p><img src="/url" alt="foo" /></p>\n');
  });

  it("Example 591: full reference image case-insensitive", () => {
    const markdown = "![foo][bar]\n\n[BAR]: /url\n";
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe('<p><img src="/url" alt="foo" /></p>\n');
  });

  it("Example 592: collapsed reference image", () => {
    const markdown = '![foo][]\n\n[foo]: /url "title"\n';
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe('<p><img src="/url" alt="foo" title="title" /></p>\n');
  });

  it("Example 593: collapsed reference image with emphasis in label", () => {
    const markdown = '![*foo* bar][]\n\n[*foo* bar]: /url "title"\n';
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe('<p><img src="/url" alt="foo bar" title="title" /></p>\n');
  });

  it("Example 594: collapsed reference image case-insensitive label", () => {
    const markdown = '![Foo][]\n\n[foo]: /url "title"\n';
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe('<p><img src="/url" alt="Foo" title="title" /></p>\n');
  });

  it("Example 595: collapsed reference image with whitespace", () => {
    const markdown = '![foo] \n[]\n\n[foo]: /url "title"\n';
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe('<p><img src="/url" alt="foo" title="title" />\n[]</p>\n');
  });

  it("Example 596: shortcut reference image", () => {
    const markdown = '![foo]\n\n[foo]: /url "title"\n';
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe('<p><img src="/url" alt="foo" title="title" /></p>\n');
  });

  it("Example 597: shortcut reference image with emphasis in label", () => {
    const markdown = '![*foo* bar]\n\n[*foo* bar]: /url "title"\n';
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe('<p><img src="/url" alt="foo bar" title="title" /></p>\n');
  });

  it("Example 599: shortcut reference image case-insensitive label", () => {
    const markdown = '![Foo]\n\n[foo]: /url "title"\n';
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe('<p><img src="/url" alt="Foo" title="title" /></p>\n');
  });

  it("Example 601: escaped bang before shortcut link", () => {
    const markdown = '\\![foo]\n\n[foo]: /url "title"\n';
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe('<p>!<a href="/url" title="title">foo</a></p>\n');
  });
});
