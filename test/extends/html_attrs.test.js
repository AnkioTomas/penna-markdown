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
});
