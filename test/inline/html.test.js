import { describe, expect, it } from "vitest";
import { createTransformer } from "../../src/transformer/index.js";

describe("inline/html", () => {
  const transformer = createTransformer();

  it("Example 644: HTML comment with hyphens and newline", () => {
    const markdown = "foo <!-- this is a --\ncomment - with hyphens -->\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe(
      "<p>foo <!-- this is a --\ncomment - with hyphens --></p>\n",
    );
  });

  it("Example 645: malformed HTML comment openers", () => {
    const markdown = "foo <!--> foo -->\n\nfoo <!---> foo -->\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe(
      "<p>foo <!--> foo --&gt;</p>\n<p>foo <!---> foo --&gt;</p>\n",
    );
  });
});
