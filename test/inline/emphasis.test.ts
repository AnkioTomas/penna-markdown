import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

describe("Emphasis (Stack Approach)", () => {
  const transformer = createEngine();

  it("basic asterisk emphasis", () => {
    const html = renderMarkdown(transformer, "*italic*");
    expect(html).toBe("<p><em>italic</em></p>\n");
  });

  it("basic underscore emphasis", () => {
    const html = renderMarkdown(transformer, "_italic_");
    expect(html).toBe("<p><em>italic</em></p>\n");
  });

  it("nested asterisk emphasis", () => {
    const html = renderMarkdown(transformer, "*outer *inner* outer*");
    expect(html).toBe("<p><em>outer <em>inner</em> outer</em></p>\n");
  });

  it("underscore flanking rules", () => {
    // Should not match if part of a word
    const html = renderMarkdown(transformer, "a_italic_b");
    expect(html).toBe("<p>a_italic_b</p>\n");
  });

  it("mixed emphasis and strong", () => {
    const html = renderMarkdown(transformer, "*italic **bold***");
    expect(html).toBe("<p><em>italic <strong>bold</strong></em></p>\n");

    const html2 = renderMarkdown(transformer, "**bold *italic***");
    expect(html2).toBe("<p><strong>bold <em>italic</em></strong></p>\n");
  });

  it("empty emphasis should not match", () => {
    const html = renderMarkdown(transformer, "**"); // Single asterisks don't match if empty inner
    expect(html).toBe("<p>**</p>\n");
    const html2 = renderMarkdown(transformer, "__");
    expect(html2).toBe("<p>__</p>\n");
  });
});
