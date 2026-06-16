import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

describe("block/list", () => {
  it("Example 4: List item with tab continuation", () => {
    const input = "  - foo\n\n\tbar";
    const html = renderMarkdown(createEngine(), input);
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>");
    expect(html).toContain("<p>foo</p>");
    expect(html).toContain("<p>bar</p>");
  });

  it("Example 9: Nested lists with tabs", () => {
    const input = " - foo\n   - bar\n\t - baz";
    const html = renderMarkdown(createEngine(), input);
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>foo\n<ul>");
    expect(html).toContain("<li>bar\n<ul>");
    expect(html).toContain("<li>baz</li>");
  });

  it("Example 5: List with tab code block", () => {
    const input = "- foo\n\n\t\tbar";
    const html = renderMarkdown(createEngine(), input);
    expect(html).toContain("<p>foo</p>");
    expect(html).toContain("<pre><code>  bar\n</code></pre>");
  });

  it("Example 7: List with tab marker and code block", () => {
    const input = "-\t\tfoo";
    const html = renderMarkdown(createEngine(), input);
    expect(html).toContain("<pre><code>  foo\n</code></pre>");
  });

  it("Example 281: Different bullet starts a new list", () => {
    const input = "- foo\n- bar\n+ baz\n";
    const html = renderMarkdown(createEngine(), input);
    expect(html).toBe(
      "<ul>\n<li>foo</li>\n<li>bar</li>\n</ul>\n<ul>\n<li>baz</li>\n</ul>\n",
    );
  });

  it("Example 282: Different ordered delimiter starts a new list", () => {
    const input = "1. foo\n2. bar\n3) baz\n";
    const html = renderMarkdown(createEngine(), input);
    expect(html).toBe(
      "<ol>\n<li>foo</li>\n<li>bar</li>\n</ol>\n<ol start=\"3\">\n<li>baz</li>\n</ol>\n",
    );
  });

  it("Example 286: Blank lines between items make a loose list", () => {
    const input = "- foo\n\n- bar\n\n\n- baz\n";
    const html = renderMarkdown(createEngine(), input);
    expect(html).toBe(
      "<ul>\n<li>\n<p>foo</p>\n</li>\n<li>\n<p>bar</p>\n</li>\n<li>\n<p>baz</p>\n</li>\n</ul>\n",
    );
  });

  it("Example 287: Nested list with loose innermost item", () => {
    const input = "- foo\n  - bar\n    - baz\n\n\n      bim\n";
    const html = renderMarkdown(createEngine(), input);
    expect(html).toBe(
      "<ul>\n<li>foo\n<ul>\n<li>bar\n<ul>\n<li>\n<p>baz</p>\n<p>bim</p>\n</li>\n</ul>\n</li>\n</ul>\n</li>\n</ul>\n",
    );
  });

  it("Example 258: Blank line after empty marker ends the item", () => {
    const html = renderMarkdown(createEngine(), "-\n\n  foo\n");
    expect(html).toBe("<ul>\n<li></li>\n</ul>\n<p>foo</p>\n");
  });

  it("Example 259: Empty bullet list item between items", () => {
    const html = renderMarkdown(createEngine(), "- foo\n-\n- bar\n");
    expect(html).toBe("<ul>\n<li>foo</li>\n<li></li>\n<li>bar</li>\n</ul>\n");
  });

  it("Example 260: Empty item with spaces after marker", () => {
    const html = renderMarkdown(createEngine(), "- foo\n-   \n- bar\n");
    expect(html).toBe("<ul>\n<li>foo</li>\n<li></li>\n<li>bar</li>\n</ul>\n");
  });

  it("Example 261: Empty ordered list item", () => {
    const html = renderMarkdown(createEngine(), "1. foo\n2.\n3. bar\n");
    expect(html).toBe("<ol>\n<li>foo</li>\n<li></li>\n<li>bar</li>\n</ol>\n");
  });

  it("Example 262: List of one empty item", () => {
    const html = renderMarkdown(createEngine(), "*\n");
    expect(html).toBe("<ul>\n<li></li>\n</ul>\n");
  });

  it("Example 233: Blank before non-list content does not make list loose", () => {
    const html = renderMarkdown(createEngine(), "- one\n\n two\n");
    expect(html).toBe("<ul>\n<li>one</li>\n</ul>\n<p>two</p>\n");
  });

  it("Example 254: Insufficient indent after blank ends list item", () => {
    const html = renderMarkdown(createEngine(), "-    foo\n\n  bar\n");
    expect(html).toBe("<ul>\n<li>foo</li>\n</ul>\n<p>bar</p>\n");
  });

  it("Example 257: Blank marker with spaces before content", () => {
    const html = renderMarkdown(createEngine(), "-   \n  foo\n");
    expect(html).toBe("<ul>\n<li>foo</li>\n</ul>\n");
  });

  it("Example 269: Lazy continuation in indented ordered list item", () => {
    const html = renderMarkdown(createEngine(), "  1.  A paragraph\n    with two lines.\n");
    expect(html).toBe("<ol>\n<li>A paragraph\nwith two lines.</li>\n</ol>\n");
  });

  it("Example 270: Lazy continuation in nested blockquote inside list in blockquote", () => {
    const html = renderMarkdown(createEngine(), "> 1. > Blockquote\ncontinued here.\n");
    expect(html).toBe(
      "<blockquote>\n<ol>\n<li>\n<blockquote>\n<p>Blockquote\ncontinued here.</p>\n</blockquote>\n</li>\n</ol>\n</blockquote>\n",
    );
  });

  it("Example 290: Insufficient indent keeps items at same list level", () => {
    const input = "- a\n - b\n  - c\n   - d\n  - e\n - f\n- g\n";
    const html = renderMarkdown(createEngine(), input);
    expect(html).toBe(
      "<ul>\n<li>a</li>\n<li>b</li>\n<li>c</li>\n<li>d</li>\n<li>e</li>\n<li>f</li>\n<li>g</li>\n</ul>\n",
    );
  });

  it("Example 291: Indented ordered items with blank lines form one loose list", () => {
    const input = "1. a\n\n  2. b\n\n   3. c\n";
    const html = renderMarkdown(createEngine(), input);
    expect(html).toBe(
      "<ol>\n<li>\n<p>a</p>\n</li>\n<li>\n<p>b</p>\n</li>\n<li>\n<p>c</p>\n</li>\n</ol>\n",
    );
  });

  it("Example 292: Marker indented more than three spaces is paragraph continuation", () => {
    const input = "- a\n - b\n  - c\n   - d\n    - e\n";
    const html = renderMarkdown(createEngine(), input);
    expect(html).toBe("<ul>\n<li>a</li>\n<li>b</li>\n<li>c</li>\n<li>d\n- e</li>\n</ul>\n");
  });

  it("Example 251: Marker line with space-indented code block", () => {
    const input = "1.     indented code\n\n   paragraph\n\n       more code\n";
    const html = renderMarkdown(createEngine(), input);
    expect(html).toBe(
      "<ol>\n<li>\n<pre><code>indented code\n</code></pre>\n<p>paragraph</p>\n<pre><code>more code\n</code></pre>\n</li>\n</ol>\n",
    );
  });

  it("Example 252: Marker line with extra space in code block", () => {
    const input = "1.      indented code\n\n   paragraph\n\n       more code\n";
    const html = renderMarkdown(createEngine(), input);
    expect(html).toBe(
      "<ol>\n<li>\n<pre><code> indented code\n</code></pre>\n<p>paragraph</p>\n<pre><code>more code\n</code></pre>\n</li>\n</ol>\n",
    );
  });

  it("Example 293: Four-space ordered line after blank is indented code", () => {
    const input = "1. a\n\n  2. b\n\n    3. c\n";
    const html = renderMarkdown(createEngine(), input);
    expect(html).toBe(
      "<ol>\n<li>\n<p>a</p>\n</li>\n<li>\n<p>b</p>\n</li>\n</ol>\n<pre><code>3. c\n</code></pre>\n",
    );
  });

  it("Example 284: Ordered list with start != 1 cannot interrupt paragraph", () => {
    const md = "The number of windows in my house is\n14.  The number of doors is 6.\n";
    const html = renderMarkdown(createEngine(), md);
    expect(html).toBe(
      "<p>The number of windows in my house is\n14.  The number of doors is 6.</p>\n",
    );
  });

  it("Example 297: Loose list skips link reference between items", () => {
    const md = "- a\n- b\n\n  [ref]: /url\n- d\n";
    const html = renderMarkdown(createEngine(), md);
    expect(html).toBe(
      "<ul>\n<li>\n<p>a</p>\n</li>\n<li>\n<p>b</p>\n</li>\n<li>\n<p>d</p>\n</li>\n</ul>\n",
    );
  });

  it("Example 295: Blank lines between items make entire list loose", () => {
    const html = renderMarkdown(createEngine(), "* a\n*\n\n* c\n");
    expect(html).toBe(
      "<ul>\n<li>\n<p>a</p>\n</li>\n<li></li>\n<li>\n<p>c</p>\n</li>\n</ul>\n",
    );
  });

  it("Example 296: One loose item makes entire list loose", () => {
    const html = renderMarkdown(createEngine(), "- a\n- b\n\n  c\n- d\n");
    expect(html).toBe(
      "<ul>\n<li>\n<p>a</p>\n</li>\n<li>\n<p>b</p>\n<p>c</p>\n</li>\n<li>\n<p>d</p>\n</li>\n</ul>\n",
    );
  });

  it("Example 298: Tight list with fenced code block containing blank lines", () => {
    const html = renderMarkdown(createEngine(), "- a\n- ```\n  b\n\n\n  ```\n- c\n");
    expect(html).toBe(
      "<ul>\n<li>a</li>\n<li>\n<pre><code>b\n\n\n</code></pre>\n</li>\n<li>c</li>\n</ul>\n",
    );
  });

  it("Example 299: Nested loose item does not loosen outer items", () => {
    const html = renderMarkdown(createEngine(), "- a\n  - b\n\n    c\n- d\n");
    expect(html).toBe(
      "<ul>\n<li>a\n<ul>\n<li>\n<p>b</p>\n<p>c</p>\n</li>\n</ul>\n</li>\n<li>d</li>\n</ul>\n",
    );
  });

  it("Example 305: Blank after nested sublist continues outer item as loose paragraph", () => {
    const html = renderMarkdown(createEngine(), "* foo\n  * bar\n\n  baz\n");
    expect(html).toBe(
      "<ul>\n<li>\n<p>foo</p>\n<ul>\n<li>bar</li>\n</ul>\n<p>baz</p>\n</li>\n</ul>\n",
    );
  });

  it("Example 301: Blockquote and fenced code inside list item", () => {
    const md = "- a\n  > b\n  ```\n  c\n  ```\n- d\n";
    const html = renderMarkdown(createEngine(), md);
    expect(html).toBe(
      "<ul>\n<li>a\n<blockquote>\n<p>b</p>\n</blockquote>\n<pre><code>c\n</code></pre>\n</li>\n<li>d</li>\n</ul>\n",
    );
  });

  it("Example 256: List items starting with blank line and indented code", () => {
    const md = "-\n  foo\n-\n  ```\n  bar\n  ```\n-\n      baz\n";
    const html = renderMarkdown(createEngine(), md);
    expect(html).toBe(
      "<ul>\n<li>foo</li>\n<li>\n<pre><code>bar\n</code></pre>\n</li>\n<li>\n<pre><code>baz\n</code></pre>\n</li>\n</ul>\n",
    );
  });

  it("Example 275: Three spaces is not enough to nest under wide ordered marker", () => {
    const html = renderMarkdown(createEngine(), "10) foo\n   - bar\n");
    expect(html).toBe(
      "<ol start=\"10\">\n<li>foo</li>\n</ol>\n<ul>\n<li>bar</li>\n</ul>\n",
    );
  });

  it("Example 278: List item with heading and setext continuation", () => {
    const html = renderMarkdown(createEngine(), "- # Foo\n- Bar\n  ---\n  baz\n");
    expect(html).toBe(
      "<ul>\n<li>\n<h1>Foo</h1>\n</li>\n<li>\n<h2>Bar</h2>\nbaz</li>\n</ul>\n",
    );
  });

  it("Example 64: Thematic break ends list item", () => {
    const html = renderMarkdown(createEngine(), "- Foo\n---\n");
    expect(html).toBe("<ul>\n<li>Foo</li>\n</ul>\n<hr />\n");
  });

  it("Example 69: Thematic break with five dashes ends list item", () => {
    const html = renderMarkdown(createEngine(), "- foo\n-----\n");
    expect(html).toBe("<ul>\n<li>foo</li>\n</ul>\n<hr />\n");
  });

  it("Example 263: Empty list item cannot interrupt paragraph", () => {
    const html = renderMarkdown(createEngine(), "foo\n*\n\nfoo\n1.\n");
    expect(html).toBe("<p>foo\n*</p>\n<p>foo\n1.</p>\n");
  });
});
