import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

describe("inline/html", () => {
  const transformer = createEngine();

  it("Example 644: HTML comment with hyphens and newline", () => {
    const markdown = "foo <!-- this is a --\ncomment - with hyphens -->\n";
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe(
      "<p>foo <!-- this is a --\ncomment - with hyphens --></p>\n",
    );
  });

  it("Example 645: malformed HTML comment openers", () => {
    const markdown = "foo <!--> foo -->\n\nfoo <!---> foo -->\n";
    const html = renderMarkdown(transformer, markdown);
    expect(html).toBe(
      "<p>foo <!--> foo --&gt;</p>\n<p>foo <!---> foo --&gt;</p>\n",
    );
  });
});
