import { describe, expect, it } from "vitest";
import { createTransformer } from "../../src/transformer/index.js";

describe("Emphasis (Stack Approach)", () => {
  const transformer = createTransformer();

  it("basic asterisk emphasis", () => {
    const { html } = transformer.render("*italic*");
    expect(html).toBe("<p><em>italic</em></p>\n");
  });

  it("basic underscore emphasis", () => {
    const { html } = transformer.render("_italic_");
    expect(html).toBe("<p><em>italic</em></p>\n");
  });

  it("nested asterisk emphasis", () => {
    const { html } = transformer.render("*outer *inner* outer*");
    expect(html).toBe("<p><em>outer <em>inner</em> outer</em></p>\n");
  });

  it("underscore flanking rules", () => {
    // Should not match if part of a word
    const { html } = transformer.render("a_italic_b");
    expect(html).toBe("<p>a_italic_b</p>\n");
  });

  it("mixed emphasis and strong", () => {
    const { html } = transformer.render("*italic **bold***");
    expect(html).toBe("<p><em>italic <strong>bold</strong></em></p>\n");
    
    const { html: html2 } = transformer.render("**bold *italic***");
    expect(html2).toBe("<p><strong>bold <em>italic</em></strong></p>\n");
  });

  it("empty emphasis should not match", () => {
    const { html } = transformer.render("**"); // Single asterisks don't match if empty inner
    expect(html).toBe("<p>**</p>\n");
    const { html: html2 } = transformer.render("__");
    expect(html2).toBe("<p>__</p>\n");
  });
});
