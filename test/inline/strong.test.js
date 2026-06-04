import { describe, expect, it } from "vitest";
import { createTransformer } from "../../src/transformer/index.js";

describe("Strong Emphasis (Stack Approach)", () => {
  const transformer = createTransformer();

  it("basic asterisk strong", () => {
    const { html } = transformer.render("**bold**");
    expect(html).toBe("<p><strong>bold</strong></p>\n");
  });

  it("basic underscore strong", () => {
    const { html } = transformer.render("__bold__");
    expect(html).toBe("<p><strong>bold</strong></p>\n");
  });

  it("nested asterisk strong", () => {
    const { html } = transformer.render("**outer **inner** outer**");
    expect(html).toBe("<p><strong>outer <strong>inner</strong> outer</strong></p>\n");
  });

  it("mixed asterisk and underscore", () => {
    const { html } = transformer.render("**bold __italic__**");
    expect(html).toBe("<p><strong>bold <strong>italic</strong></strong></p>\n");
  });
  
  it("empty strong should not match", () => {
    const { html } = transformer.render("****");
    expect(html).toBe("<p>****</p>\n");
    const { html: html2 } = transformer.render("____");
    expect(html2).toBe("<p>____</p>\n");
  });
});
