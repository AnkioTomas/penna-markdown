import { describe, expect, it } from "vitest";
import { createEngine } from "../helpers/engine.js";

describe("block/heading", () => {
  it("Example 40: ATX heading not interrupting paragraph due to indentation", () => {
    const input = "foo\n    # bar";
    const { html } = createEngine().render(input);
    expect(html).toBe("<p>foo\n# bar</p>\n");
  });

  it("Example 63: setext underline is paragraph text inside blockquote", () => {
    const { html } = createEngine().render("> foo\nbar\n===\n");
    expect(html).toBe(
      "<blockquote>\n<p>foo\nbar\n===</p>\n</blockquote>\n",
    );
  });

  it("Example 62: thematic break after blockquote is not lazy continuation", () => {
    const { html } = createEngine().render("> Foo\n---\n");
    expect(html).toBe(
      "<blockquote>\n<p>Foo</p>\n</blockquote>\n<hr />\n",
    );
  });
});
