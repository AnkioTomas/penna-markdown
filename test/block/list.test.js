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
});
