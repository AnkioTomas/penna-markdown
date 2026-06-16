import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

describe("block/heading", () => {
  it("Example 40: ATX heading not interrupting paragraph due to indentation", () => {
    const input = "foo\n    # bar";
    const html = renderMarkdown(createEngine(), input);
    expect(html).toBe("<p>foo\n# bar</p>\n");
  });

  it("Example 46: backslash-escaped # do not count as closing sequence", () => {
    const html = renderMarkdown(
      createEngine(),
      "### foo \\###\n## foo #\\##\n# foo \\#\n",
    );
    expect(html).toBe(
      "<h3>foo ###</h3>\n<h2>foo ###</h2>\n<h1>foo #</h1>\n",
    );
  });

  it("Example 63: setext underline is paragraph text inside blockquote", () => {
    const html = renderMarkdown(createEngine(), "> foo\nbar\n===\n");
    expect(html).toBe(
      "<blockquote>\n<p>foo\nbar\n===</p>\n</blockquote>\n",
    );
  });

  it("Example 62: thematic break after blockquote is not lazy continuation", () => {
    const html = renderMarkdown(createEngine(), "> Foo\n---\n");
    expect(html).toBe(
      "<blockquote>\n<p>Foo</p>\n</blockquote>\n<hr />\n",
    );
  });
});
