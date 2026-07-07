import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

describe("extends/inline_comment", () => {
  const engine = () => createEngine();

  it("removes %% comment %% from rendered HTML", () => {
    const html = renderMarkdown(
      engine(),
      "可见 %% 这一行是写给自己的悄悄话，预览模式和导出时完全不可见 %% 内容",
    );
    expect(html).toBe("<p>可见  内容</p>\n");
  });

  it("supports empty comment", () => {
    const html = renderMarkdown(engine(), "前%%%%后");
    expect(html).toBe("<p>前后</p>\n");
  });

  it("leaves unclosed comment as plain text", () => {
    const html = renderMarkdown(engine(), "hello %% still visible");
    expect(html).toBe("<p>hello %% still visible</p>\n");
  });

  it("does not strip inside inline code", () => {
    const html = renderMarkdown(engine(), "use `%% keep %%` here");
    expect(html).toBe("<p>use <code>%% keep %%</code> here</p>\n");
  });

  it("does not strip inside fenced code", () => {
    const md = "```\n%% secret %%\n```";
    const html = renderMarkdown(engine(), md);
    expect(html).toBe("<pre><code>%% secret %%\n</code></pre>\n");
  });
});
