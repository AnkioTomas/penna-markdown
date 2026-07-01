import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

describe("inline/break", () => {
  const transformer = createEngine();

  it("Example 654: backslash hard line break", () => {
    expect(renderMarkdown(transformer, "foo\\\nbaz\n")).toBe(
      "<p>foo<br />\nbaz</p>\n",
    );
  });

  it("Example 657: backslash hard line break with trailing spaces on next line", () => {
    expect(renderMarkdown(transformer, "foo\\\n     bar\n")).toBe(
      "<p>foo<br />\nbar</p>\n",
    );
  });

  it("Example 659: hard line break inside emphasis", () => {
    expect(renderMarkdown(transformer, "*foo\\\nbar*\n")).toBe(
      "<p><em>foo<br />\nbar</em></p>\n",
    );
  });

  it("Example 655: two spaces hard line break", () => {
    expect(renderMarkdown(transformer, "foo       \nbaz\n")).toBe(
      "<p>foo<br />\nbaz</p>\n",
    );
  });
});
