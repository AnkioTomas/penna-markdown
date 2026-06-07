import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("emoji extension", () => {
  it("renders :smile: and :thumbsup:", () => {
    const t = createTransformerWithExtensions(["emoji"]);
    expect(t.render("Hello :smile:").html).toBe("<p>Hello 😄</p>\n");
    expect(t.render("Good job :thumbsup:").html).toBe("<p>Good job 👍</p>\n");
  });

  it("supports :+1: alias", () => {
    const t = createTransformerWithExtensions(["emoji"]);
    expect(t.render(":+1:").html).toBe("<p>👍</p>\n");
  });

  it("supports Chinese shortcodes", () => {
    const t = createTransformerWithExtensions(["emoji"]);
    expect(t.render("很棒 :赞:").html).toBe("<p>很棒 👍</p>\n");
    expect(t.render(":微笑:").html).toBe("<p>😊</p>\n");
  });

  it("leaves unknown shortcodes as text", () => {
    const t = createTransformerWithExtensions(["emoji"]);
    expect(t.render(":not_a_real_emoji:").html).toBe("<p>:not_a_real_emoji:</p>\n");
  });

  it("does not parse inside code spans", () => {
    const t = createTransformerWithExtensions(["emoji"]);
    expect(t.render("`:smile:`").html).toBe("<p><code>:smile:</code></p>\n");
  });

  it("supports escaped colon", () => {
    const t = createTransformerWithExtensions(["emoji"]);
    expect(t.render("\\:smile:").html).toBe("<p>:smile:</p>\n");
  });

  it("is disabled without extension", () => {
    const t = createTransformer();
    expect(t.render(":smile:").html).toBe("<p>:smile:</p>\n");
  });
});
