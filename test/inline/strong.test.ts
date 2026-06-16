import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

describe("Strong Emphasis (Stack Approach)", () => {
  const transformer = createEngine();

  it("basic asterisk strong", () => {
    const html = renderMarkdown(transformer, "**bold**");
    expect(html).toBe("<p><strong>bold</strong></p>\n");
  });

  it("basic underscore strong", () => {
    const html = renderMarkdown(transformer, "__bold__");
    expect(html).toBe("<p><strong>bold</strong></p>\n");
  });

  it("same-delimiter strong flattens (GFM example 436)", () => {
    const html = renderMarkdown(transformer, "**outer **inner** outer**");
    expect(html).toBe("<p><strong>outer inner outer</strong></p>\n");
  });

  it("mixed asterisk and underscore", () => {
    const html = renderMarkdown(transformer, "**bold __italic__**");
    expect(html).toBe("<p><strong>bold <strong>italic</strong></strong></p>\n");
  });
  
  it("empty strong should not match", () => {
    const html = renderMarkdown(transformer, "**** is not an empty strong emphasis");
    expect(html).toBe("<p>**** is not an empty strong emphasis</p>\n");
    const html2 = renderMarkdown(transformer, "____ is not an empty strong emphasis");
    expect(html2).toBe("<p>____ is not an empty strong emphasis</p>\n");
  });
});
