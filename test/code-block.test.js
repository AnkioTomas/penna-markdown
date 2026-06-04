import { describe, expect, it } from "vitest";
import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import { builtinBlockSyntax, builtinInlineSyntax } from "@/transformer/gfm/builtin.js";

function createEngine(options = {}) {
  return new TransformerEngine({
    blockParsers: builtinBlockSyntax,
    inlineParsers: builtinInlineSyntax,
    ...options
  });
}

describe("code block render", () => {
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
      // indent "  " should be stripped
      expect(html).toBe("<pre><code>line 1\nline 2\n</code></pre>\n");
  });

  it("renders indented code block", () => {
      const input = "    line 1\n    line 2";
      const { html } = createEngine().render(input);
      expect(html).toBe("<pre><code>line 1\nline 2\n</code></pre>\n");
  });

  it("Example 91: inline code across lines", () => {
    const { html } = createEngine().render("``\nfoo\n``");
    expect(html).toBe("<p><code>foo</code></p>\n");
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
    // The content includes the empty line, the 3-backtick lines, and "aaa".
    // It should end with one newline if we reach end of doc or if it's closed properly.
    // Example 97 actually ends with length-3 backticks which DON'T close it.
    // So it goes to the end of the document.
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

  it("Example 345: multiline code span with spaces", () => {
    const input = "``\nfoo\nbar  \nbaz\n``";
    const { html } = createEngine().render(input);
    expect(html).toBe("<p><code>foo bar   baz</code></p>\n");
  });

  it("Example 346: code span with trailing space", () => {
    const input = "``\nfoo \n``";
    const { html } = createEngine().render(input);
    expect(html).toBe("<p><code>foo </code></p>\n");
  });

  it("Example 347: code span with internal spaces and newline", () => {
    const input = "`foo   bar \nbaz`";
    const { html } = createEngine().render(input);
    expect(html).toBe("<p><code>foo   bar  baz</code></p>\n");
  });

  it("Example 40: ATX heading not interrupting paragraph due to indentation", () => {
    const input = "foo\n    # bar";
    const { html } = createEngine().render(input);
    expect(html).toBe("<p>foo\n# bar</p>\n");
  });

  it("indented code does NOT interrupt paragraph", () => {
    const input = "foo\n    bar";
    const { html } = createEngine().render(input);
    expect(html).toBe("<p>foo\nbar</p>\n");
  });

  it("Nested blockquotes with leading spaces (recursion test)", () => {
    const input = " > > foo";
    const { html } = createEngine().render(input);
    expect(html).toBe("<blockquote>\n<blockquote>\n<p>foo</p>\n</blockquote>\n</blockquote>\n");
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

  it("Example 4: List item with tab continuation", () => {
      const input = "  - foo\n\n\tbar";
      const { html } = createEngine().render(input);
      expect(html).toContain("<ul>");
      expect(html).toContain("<li>");
      expect(html).toContain("<p>foo</p>");
      expect(html).toContain("<p>bar</p>");
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
});

describe("transformer hooks", () => {
    it("uses beforeRender to override default rendering", () => {
        const engine = createEngine({
            beforeRender: ({type, name, node}) => {
                if (name === "code") {
                    return `<custom-code>${node.props.content}</custom-code>`;
                }
            }
        });
        const { html } = engine.render("```\nhello\n```");
        expect(html).toBe("<custom-code>hello</custom-code>\n");
    });

    it("uses afterRender to post-process html", () => {
        const engine = createEngine({
            afterRender: ({type, name, node, html}) => {
                if (name === "code") {
                    return html.replace("<code>", '<code class="processed">');
                }
            }
        });
        const { html } = engine.render("```\nhello\n```");
        expect(html).toBe("<pre><code class=\"processed\">hello\n</code></pre>\n");
    });

    it("works with inline hooks", () => {
        const engine = createEngine({
            afterRender: ({type, name, node, html}) => {
                if (name === "text") {
                    return html.toUpperCase();
                }
            }
        });
        const { html } = engine.render("hello");
        expect(html).toBe("<p>HELLO</p>\n");
    });
});
