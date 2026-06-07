import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("extends/inline_comment", () => {
  const engine = () => createTransformerWithExtensions(["inline_comment"]);
  const base = () => createTransformer();

  it("removes %% comment %% from rendered HTML", () => {
    const { html } = engine().render(
      "可见 %% 这一行是写给自己的悄悄话，预览模式和导出时完全不可见 %% 内容",
    );
    expect(html).toBe("<p>可见  内容</p>\n");
  });

  it("supports empty comment", () => {
    const { html } = engine().render("前%%%%后");
    expect(html).toBe("<p>前后</p>\n");
  });

  it("leaves unclosed comment as plain text", () => {
    const { html } = engine().render("hello %% still visible");
    expect(html).toBe("<p>hello %% still visible</p>\n");
  });

  it("does not strip inside inline code", () => {
    const { html } = engine().render("use `%% keep %%` here");
    expect(html).toBe("<p>use <code>%% keep %%</code> here</p>\n");
  });

  it("does not strip inside fenced code", () => {
    const md = "```\n%% secret %%\n```";
    const { html } = engine().render(md);
    expect(html).toBe("<pre><code>%% secret %%\n</code></pre>\n");
  });

  it("leaves syntax unchanged when extension disabled", () => {
    const { html } = base().render("a %% hidden %% b");
    expect(html).toBe("<p>a %% hidden %% b</p>\n");
  });
});
