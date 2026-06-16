import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

describe("block/paragraph", () => {
  it("indented code does NOT interrupt paragraph", () => {
    const input = "foo\n    bar";
    const html = renderMarkdown(createEngine(), input);
    expect(html).toBe("<p>foo\nbar</p>\n");
  });

  it("GFM example 196: trailing spaces on last line are stripped", () => {
    const html = renderMarkdown(createEngine(), "aaa     \nbbb     \n");
    expect(html).toBe("<p>aaa<br />\nbbb</p>\n");
  });
});
