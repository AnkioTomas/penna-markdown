import { describe, expect, it } from "vitest";
import { createEngine } from "../helpers/engine.js";

describe("block/list", () => {
  it("Example 4: List item with tab continuation", () => {
    const input = "  - foo\n\n\tbar";
    const { html } = createEngine().render(input);
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>");
    expect(html).toContain("<p>foo</p>");
    expect(html).toContain("<p>bar</p>");
  });

  it("Example 9: Nested lists with tabs", () => {
    const input = " - foo\n   - bar\n\t - baz";
    const { html } = createEngine().render(input);
    expect(html).toContain("<ul>");
    expect(html).toContain("<li><p>foo</p>\n<ul>");
    expect(html).toContain("<li><p>bar</p>\n<ul>");
    expect(html).toContain("<li><p>baz</p></li>");
  });

  it("Example 5: List with tab code block", () => {
    const input = "- foo\n\n\t\tbar";
    const { html } = createEngine().render(input);
    expect(html).toContain("<p>foo</p>");
    expect(html).toContain("<pre><code>  bar\n</code></pre>");
  });

  it("Example 7: List with tab marker and code block", () => {
    const input = "-\t\tfoo";
    const { html } = createEngine().render(input);
    expect(html).toContain("<pre><code>  foo\n</code></pre>");
  });

  it("Example 281: Different bullet starts a new list", () => {
    const input = "- foo\n- bar\n+ baz\n";
    const { html } = createEngine().render(input);
    expect(html).toBe(
      "<ul>\n<li>foo</li>\n<li>bar</li>\n</ul>\n<ul>\n<li>baz</li>\n</ul>\n",
    );
  });

  it("Example 282: Different ordered delimiter starts a new list", () => {
    const input = "1. foo\n2. bar\n3) baz\n";
    const { html } = createEngine().render(input);
    expect(html).toBe(
      "<ol>\n<li>foo</li>\n<li>bar</li>\n</ol>\n<ol start=\"3\">\n<li>baz</li>\n</ol>\n",
    );
  });

  it("Example 286: Blank lines between items make a loose list", () => {
    const input = "- foo\n\n- bar\n\n\n- baz\n";
    const { html } = createEngine().render(input);
    expect(html).toBe(
      "<ul>\n<li>\n<p>foo</p>\n</li>\n<li>\n<p>bar</p>\n</li>\n<li>\n<p>baz</p>\n</li>\n</ul>\n",
    );
  });

  it("Example 287: Nested list with loose innermost item", () => {
    const input = "- foo\n  - bar\n    - baz\n\n\n      bim\n";
    const { html } = createEngine().render(input);
    expect(html).toBe(
      "<ul>\n<li>foo\n<ul>\n<li>bar\n<ul>\n<li>\n<p>baz</p>\n<p>bim</p>\n</li>\n</ul>\n</li>\n</ul>\n</li>\n</ul>\n",
    );
  });

  it("Example 258: Blank line after empty marker ends the item", () => {
    const { html } = createEngine().render("-\n\n  foo\n");
    expect(html).toBe("<ul>\n<li></li>\n</ul>\n<p>foo</p>\n");
  });

  it("Example 259: Empty bullet list item between items", () => {
    const { html } = createEngine().render("- foo\n-\n- bar\n");
    expect(html).toBe("<ul>\n<li>foo</li>\n<li></li>\n<li>bar</li>\n</ul>\n");
  });

  it("Example 260: Empty item with spaces after marker", () => {
    const { html } = createEngine().render("- foo\n-   \n- bar\n");
    expect(html).toBe("<ul>\n<li>foo</li>\n<li></li>\n<li>bar</li>\n</ul>\n");
  });

  it("Example 261: Empty ordered list item", () => {
    const { html } = createEngine().render("1. foo\n2.\n3. bar\n");
    expect(html).toBe("<ol>\n<li>foo</li>\n<li></li>\n<li>bar</li>\n</ol>\n");
  });

  it("Example 262: List of one empty item", () => {
    const { html } = createEngine().render("*\n");
    expect(html).toBe("<ul>\n<li></li>\n</ul>\n");
  });

  it("Example 233: Blank before non-list content does not make list loose", () => {
    const { html } = createEngine().render("- one\n\n two\n");
    expect(html).toBe("<ul>\n<li>one</li>\n</ul>\n<p>two</p>\n");
  });

  it("Example 269: Lazy continuation in indented ordered list item", () => {
    const { html } = createEngine().render("  1.  A paragraph\n    with two lines.\n");
    expect(html).toBe("<ol>\n<li>A paragraph\nwith two lines.</li>\n</ol>\n");
  });

  it("Example 263: Empty list item cannot interrupt paragraph", () => {
    const { html } = createEngine().render("foo\n*\n\nfoo\n1.\n");
    expect(html).toBe("<p>foo\n*</p>\n<p>foo\n1.</p>\n");
  });
});
