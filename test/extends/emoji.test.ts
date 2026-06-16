import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("emoji extension", () => {
  it("renders :smile: and :thumbsup:", () => {
    const t = createTransformerWithExtensions(["emoji"]);
    expect(renderMarkdown(t, "Hello :smile:")).toBe("<p>Hello 😄</p>\n");
    expect(renderMarkdown(t, "Good job :thumbsup:")).toBe("<p>Good job 👍</p>\n");
  });

  it("supports :+1: alias", () => {
    const t = createTransformerWithExtensions(["emoji"]);
    expect(renderMarkdown(t, ":+1:")).toBe("<p>👍</p>\n");
  });

  it("supports Chinese shortcodes", () => {
    const t = createTransformerWithExtensions(["emoji"]);
    expect(renderMarkdown(t, "很棒 :赞:")).toBe("<p>很棒 👍</p>\n");
    expect(renderMarkdown(t, ":微笑:")).toBe("<p>😊</p>\n");
  });

  it("leaves unknown shortcodes as text", () => {
    const t = createTransformerWithExtensions(["emoji"]);
    expect(renderMarkdown(t, ":not_a_real_emoji:")).toBe("<p>:not_a_real_emoji:</p>\n");
  });

  it("does not parse inside code spans", () => {
    const t = createTransformerWithExtensions(["emoji"]);
    expect(renderMarkdown(t, "`:smile:`")).toBe("<p><code>:smile:</code></p>\n");
  });

  it("supports escaped colon", () => {
    const t = createTransformerWithExtensions(["emoji"]);
    expect(renderMarkdown(t, "\\:smile:")).toBe("<p>:smile:</p>\n");
  });

  it("is disabled without extension", () => {
    const t = createEngine();
    expect(renderMarkdown(t, ":smile:")).toBe("<p>:smile:</p>\n");
  });
});
