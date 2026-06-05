import { describe, expect, it } from "vitest";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("highlight extension", () => {
  it("renders ==text== as mark", () => {
    const t = createTransformerWithExtensions(["highlight"]);
    expect(t.render("==hello==").html).toBe("<p><mark>hello</mark></p>\n");
  });

  it("supports nested inline", () => {
    const t = createTransformerWithExtensions(["highlight"]);
    expect(t.render("==**bold**==").html).toBe("<p><mark><strong>bold</strong></mark></p>\n");
  });
});
