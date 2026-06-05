import { describe, expect, it } from "vitest";
import { createEngine } from "../helpers/engine.js";

describe("block/code", () => {
  it("renders basic fenced code block", () => {
    const { html } = createEngine().render("```\nfoo\nbar\n```");
    expect(html).toBe("<pre><code>foo\nbar\n</code></pre>\n");
  });

  it("renders fenced code block with language", () => {
    const { html } = createEngine().render("```js\nconst a = 1;\n```");
    expect(html).toBe('<pre><code class="language-js">const a = 1;\n</code></pre>\n');
  });

  it("renders fenced code block with ~~~", () => {
    const { html } = createEngine().render("~~~\nfoo\n~~~");
    expect(html).toBe("<pre><code>foo\n</code></pre>\n");
  });

  it("handles indentation in fenced code block", () => {
    const input = "  ```\n  line 1\n  line 2\n  ```";
    const { html } = createEngine().render(input);
    expect(html).toBe("<pre><code>line 1\nline 2\n</code></pre>\n");
  });

  it("renders indented code block", () => {
    const input = "    line 1\n    line 2";
    const { html } = createEngine().render(input);
    expect(html).toBe("<pre><code>line 1\nline 2\n</code></pre>\n");
  });

  it("Example 96: empty fenced code block", () => {
    const { html } = createEngine().render("```\n```");
    expect(html).toBe("<pre><code></code></pre>\n");
  });

  it("Example 100: empty fenced code block with spaces", () => {
    const { html } = createEngine().render("```\n```");
    expect(html).toBe("<pre><code></code></pre>\n");
  });

  it("Example 107: indented closing fence", () => {
    const input = "```\naaa\n    ```\n```";
    const { html } = createEngine().render(input);
    expect(html).toBe("<pre><code>aaa\n    ```\n</code></pre>\n");
  });

  it("Example 108: backticks in info string reject code block", () => {
    const input = "``` ```\naaa";
    const { html } = createEngine().render(input);
    expect(html).toBe("<p><code> </code>\naaa</p>\n");
  });

  it("Example 97: closing fence with more backticks than opening fence", () => {
    const input = "`````\n\n```\naaa\n```\n```\n```";
    const { html } = createEngine().render(input);
    expect(html).toBe("<pre><code>\n```\naaa\n```\n```\n```\n</code></pre>\n");
  });

  it("Example 109: tilde fences with spaces reject as closing fence", () => {
    const input = "~~~~~~\naaa\n~~~ ~~";
    const { html } = createEngine().render(input);
    expect(html).toBe("<pre><code>aaa\n~~~ ~~\n</code></pre>\n");
  });

  it("Example 110: code block interrupts paragraph", () => {
    const input = "foo\n```\nbar\n```\nbaz";
    const { html } = createEngine().render(input);
    expect(html).toBe("<p>foo</p>\n<pre><code>bar\n</code></pre>\n<p>baz</p>\n");
  });

  it("Example 1: Tab at start of line for indented code", () => {
    const input = "\tfoo\tbaz\t\tbim";
    const { html } = createEngine().render(input);
    expect(html).toBe("<pre><code>foo\tbaz\t\tbim\n</code></pre>\n");
  });

  it("Example 11: Thematic break with tabs", () => {
    const input = "*\t*\t*\t";
    const { html } = createEngine().render(input);
    expect(html).toBe("<hr />\n");
  });

  it("Example 2: Spaces and tab at start of line for indented code", () => {
    const input = "  \tfoo\tbaz\t\tbim";
    const { html } = createEngine().render(input);
    expect(html).toBe("<pre><code>foo\tbaz\t\tbim\n</code></pre>\n");
  });

  it("Example 6: Blockquote with tab code block", () => {
    const input = ">\t\tfoo";
    const { html } = createEngine().render(input);
    expect(html).toBe("<blockquote>\n<pre><code>  foo\n</code></pre>\n</blockquote>\n");
  });

  it("Example 8: Indented code lines with tabs", () => {
    const input = "    foo\n\tbar";
    const { html } = createEngine().render(input);
    expect(html).toBe("<pre><code>foo\nbar\n</code></pre>\n");
  });

  it("Nested blockquotes with leading spaces (recursion test)", () => {
    const input = " > > foo";
    const { html } = createEngine().render(input);
    expect(html).toBe(
      "<blockquote>\n<blockquote>\n<p>foo</p>\n</blockquote>\n</blockquote>\n",
    );
  });
});
