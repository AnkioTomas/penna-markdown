import { describe, expect, it } from "vitest";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("html_attrs extension", () => {
  const transformer = createTransformerWithExtensions(["html_attrs"]);

  it("injects attrs into previous inline tag", () => {
    const { html } = transformer.render('**bold**{class="x"}');
    expect(html).toBe('<p><strong class="x">bold</strong></p>\n');
  });

  it("keeps invalid brace syntax as text", () => {
    const { html } = transformer.render("{123}");
    expect(html).toBe("<p>{123}</p>\n");
  });

  it("parses simplified .class syntax", () => {
    const { html } = transformer.render("**bold**{.highlight}");
    expect(html).toBe('<p><strong class="highlight">bold</strong></p>\n');
  });

  it("parses simplified #id syntax", () => {
    const { html } = transformer.render("**bold**{#special}");
    expect(html).toBe('<p><strong id="special">bold</strong></p>\n');
  });

  it("parses mixed #id and .class syntax", () => {
    const { html } = transformer.render("**bold**{#id .class}");
    expect(html).toBe('<p><strong id="id" class="class">bold</strong></p>\n');
  });

  it("parses multiple .class syntax", () => {
    const { html } = transformer.render("**bold**{.a .b .c}");
    expect(html).toBe('<p><strong class="a b c">bold</strong></p>\n');
  });

  it("supports combined simplified and traditional syntax", () => {
    const { html } = transformer.render("**bold**{#id .class data-x=\"1\"}");
    expect(html).toBe('<p><strong id="id" data-x="1" class="class">bold</strong></p>\n');
  });

  it("parses traditional syntax still works", () => {
    const { html } = transformer.render('**bold**{class="highlight" data-a="1"}');
    expect(html).toBe('<p><strong data-a="1" class="highlight">bold</strong></p>\n');
  });
});
