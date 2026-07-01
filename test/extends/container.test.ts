import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

function panelHtml(type: string, title: string, body: string) {
  const titleHtml = title ? `<p class="cherry-alert__title">${title}</p>\n` : "";
  return `<div class="cherry-alert cherry-alert--${type}">\n${titleHtml}${body}\n</div>\n`;
}

function alignHtml(type: string, body: string, title = "") {
  const titleHtml = title ? `<p class="cherry-align__title">${title}</p>\n` : "";
  return `<div class="cherry-align cherry-align--${type}">\n${titleHtml}${body}\n</div>\n`;
}

describe("extends/container", () => {
  const engine = () => createEngine();

  it("renders tip container with title emoji", () => {
    const md = `::: tip 💡 这是一个小提示
这里是提示的内容。
:::`;
    expect(renderMarkdown(engine(), md)).toBe(
      panelHtml("tip", "💡 这是一个小提示", "<p>这里是提示的内容。</p>"),
    );
  });

  it("renders danger container", () => {
    const md = `::: danger 🚨 危险操作
删除数据库前请务必备份！
:::`;
    expect(renderMarkdown(engine(), md)).toBe(
      panelHtml("danger", "🚨 危险操作", "<p>删除数据库前请务必备份！</p>"),
    );
  });

  it("supports container without title", () => {
    const md = `::: info
仅内容
:::`;
    expect(renderMarkdown(engine(), md)).toBe(
      panelHtml("info", "", "<p>仅内容</p>"),
    );
  });

  it("supports multiple inner blocks", () => {
    const md = `::: warning 注意
第一段

第二段
:::`;
    expect(renderMarkdown(engine(), md)).toBe(
      panelHtml("warning", "注意", "<p>第一段</p>\n<p>第二段</p>"),
    );
  });

  it("renders left alignment", () => {
    const md = `::: left
左对齐的内容
:::`;
    expect(renderMarkdown(engine(), md)).toBe(
      alignHtml("left", "<p>左对齐的内容</p>"),
    );
  });

  it("renders center alignment", () => {
    const md = `::: center
居中的内容
:::`;
    expect(renderMarkdown(engine(), md)).toBe(
      alignHtml("center", "<p>居中的内容</p>"),
    );
  });

  it("renders right alignment", () => {
    const md = `::: right
右对齐的内容
:::`;
    expect(renderMarkdown(engine(), md)).toBe(
      alignHtml("right", "<p>右对齐的内容</p>"),
    );
  });

  it("renders justify alignment", () => {
    const md = `::: justify
两端对齐的内容
:::`;
    expect(renderMarkdown(engine(), md)).toBe(
      alignHtml("justify", "<p>两端对齐的内容</p>"),
    );
  });

  it("supports alignment type aliases", () => {
    const md = `::: l
左
:::`;
    expect(renderMarkdown(engine(), md)).toBe(alignHtml("left", "<p>左</p>"));
  });

  it("supports alignment with optional title", () => {
    const md = `::: center 标题
正文
:::`;
    expect(renderMarkdown(engine(), md)).toBe(
      alignHtml("center", "<p>正文</p>", "标题"),
    );
  });

  it("supports nested containers", () => {
    const md = `::: tip 外层
::: info 内层
嵌套正文
:::
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('<div class="cherry-alert cherry-alert--tip">');
    expect(html).toContain('<div class="cherry-alert cherry-alert--info">');
    expect(html).toContain("<p>嵌套正文</p>");
  });

  it("supports inline markdown in title", () => {
    const md = `::: note **粗体**标题
正文
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain("<strong>粗体</strong>标题");
  });
});
