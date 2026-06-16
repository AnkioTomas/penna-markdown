import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("highlight extension", () => {
  it("renders ==text== as mark", () => {
    const t = createTransformerWithExtensions(["highlight"]);
    expect(renderMarkdown(t, "==hello==")).toBe("<p><mark class=\"cherry-mark\">hello</mark></p>\n");
  });

  it("supports nested inline", () => {
    const t = createTransformerWithExtensions(["highlight"]);
    expect(renderMarkdown(t, "==**bold**==")).toBe("<p><mark class=\"cherry-mark\"><strong>bold</strong></mark></p>\n");
  });
});
