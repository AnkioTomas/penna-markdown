import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

describe("inline/backslash escape", () => {
  it("escapes punctuation via text parser", () => {
    const html = renderMarkdown(
      createEngine(),
      "\\*not emphasized*\n\\# not a heading\n",
    );
    expect(html).toBe("<p>*not emphasized*\n# not a heading</p>\n");
  });
});
