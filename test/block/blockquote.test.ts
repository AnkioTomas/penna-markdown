import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

describe("block/blockquote", () => {
  it("renders paragraph inside blockquote", () => {
    const html = renderMarkdown(createEngine(), "> foo\n");
    expect(html).toBe("<blockquote>\n<p>foo</p>\n</blockquote>\n");
  });

  it("renders nested blockquote", () => {
    const html = renderMarkdown(createEngine(), ">> bar\n");
    expect(html).toBe(
      "<blockquote>\n<blockquote>\n<p>bar</p>\n</blockquote>\n</blockquote>\n",
    );
  });

  it("merges lazy continuation lines with fewer markers (CommonMark #253)", () => {
    const html = renderMarkdown(createEngine(), ">>> foo\n> bar\n>>baz\n");
    expect(html).toBe(
      "<blockquote>\n<blockquote>\n<blockquote>\n<p>foo\nbar\nbaz</p>\n</blockquote>\n</blockquote>\n</blockquote>\n",
    );
  });

  it("merges lazy continuation without markers (CommonMark #252)", () => {
    const html = renderMarkdown(createEngine(), "> > > foo\nbar\n");
    expect(html).toBe(
      "<blockquote>\n<blockquote>\n<blockquote>\n<p>foo\nbar</p>\n</blockquote>\n</blockquote>\n</blockquote>\n",
    );
  });

  it("renders empty blockquote (CommonMark #241-242)", () => {
    expect(renderMarkdown(createEngine(), ">\n")).toBe("<blockquote>\n</blockquote>\n");
    expect(renderMarkdown(createEngine(), ">\n>  \n> \n")).toBe(
      "<blockquote>\n</blockquote>\n",
    );
  });

  it("paragraph interrupted by blockquote (CommonMark #247)", () => {
    expect(renderMarkdown(createEngine(), "foo\n> bar\n")).toBe(
      "<p>foo</p>\n<blockquote>\n<p>bar</p>\n</blockquote>\n",
    );
  });

  it("blank marker line splits paragraphs (CommonMark #246)", () => {
    expect(renderMarkdown(createEngine(), "> foo\n>\n> bar\n")).toBe(
      "<blockquote>\n<p>foo</p>\n<p>bar</p>\n</blockquote>\n",
    );
  });

  it("Example 213: omitting > on second list item ends blockquote", () => {
    const html = renderMarkdown(createEngine(), "> - foo\n- bar\n");
    expect(html).toBe(
      "<blockquote>\n<ul>\n<li>foo</li>\n</ul>\n</blockquote>\n<ul>\n<li>bar</li>\n</ul>\n",
    );
  });

  it("Example 215: omitting > on fenced code continuation ends blockquote", () => {
    const html = renderMarkdown(createEngine(), "> ```\nfoo\n```\n");
    expect(html).toBe(
      "<blockquote>\n<pre><code></code></pre>\n</blockquote>\n<p>foo</p>\n<pre><code></code></pre>\n",
    );
  });

  it("Example 216: four-space line can lazy continue blockquote paragraph", () => {
    const html = renderMarkdown(createEngine(), "> foo\n    - bar\n");
    expect(html).toBe(
      "<blockquote>\n<p>foo\n- bar</p>\n</blockquote>\n",
    );
  });

  it("Example 220: blank line separates block quotes", () => {
    const html = renderMarkdown(createEngine(), "> foo\n\n> bar\n");
    expect(html).toBe(
      "<blockquote>\n<p>foo</p>\n</blockquote>\n<blockquote>\n<p>bar</p>\n</blockquote>\n",
    );
  });

  it("Example 226: blank line ends blockquote before paragraph", () => {
    const html = renderMarkdown(createEngine(), "> bar\n\nbaz\n");
    expect(html).toBe(
      "<blockquote>\n<p>bar</p>\n</blockquote>\n<p>baz</p>\n",
    );
  });

  it("Example 227: empty > line ends blockquote when next line has no marker", () => {
    const html = renderMarkdown(createEngine(), "> bar\n>\nbaz\n");
    expect(html).toBe(
      "<blockquote>\n<p>bar</p>\n</blockquote>\n<p>baz</p>\n",
    );
  });

  it("Example 238: list in nested blockquote ends before insufficiently indented content", () => {
    const html = renderMarkdown(createEngine(), ">>- one\n>>\n  >  > two\n");
    expect(html).toBe(
      "<blockquote>\n<blockquote>\n<ul>\n<li>one</li>\n</ul>\n<p>two</p>\n</blockquote>\n</blockquote>\n",
    );
  });
});
