import { describe, expect, it } from "vitest";
import { createEngine } from "../helpers/engine.js";

describe("inline/code", () => {
  it("Example 91: inline code across lines", () => {
    const { html } = createEngine().render("``\nfoo\n``");
    expect(html).toBe("<p><code>foo</code></p>\n");
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

  it("Example 357: unclosed backtick string stays literal", () => {
    const { html } = createEngine().render("```foo``\n");
    expect(html).toBe("<p>```foo``</p>\n");
  });

  it("Example 358: unclosed single backtick stays literal", () => {
    const { html } = createEngine().render("`foo\n");
    expect(html).toBe("<p>`foo</p>\n");
  });

  it("Example 359: shorter close allows inner code span", () => {
    const { html } = createEngine().render("`foo``bar``\n");
    expect(html).toBe("<p>`foo<code>bar</code></p>\n");
  });
});
