import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

function panelHtml(type, title, body) {
  const titleHtml = title
    ? `<div class="cherry-panel--title cherry-panel--title__not-empty">${title}</div>\n`
    : "";
  return `<div class="cherry-panel cherry-panel__${type}">\n${titleHtml}<div class="cherry-panel--body">${body}</div>\n</div>\n`;
}

describe("extends/container", () => {
  const engine = () => createTransformerWithExtensions(["container"]);
  const base = () => createTransformer();

  it("renders tip container with title emoji", () => {
    const md = `::: tip 💡 这是一个小提示
这里是提示的内容。
:::`;
    expect(engine().render(md).html).toBe(
      panelHtml("tip", "💡 这是一个小提示", "<p>这里是提示的内容。</p>"),
    );
  });

  it("renders danger container", () => {
    const md = `::: danger 🚨 危险操作
删除数据库前请务必备份！
:::`;
    expect(engine().render(md).html).toBe(
      panelHtml("danger", "🚨 危险操作", "<p>删除数据库前请务必备份！</p>"),
    );
  });

  it("supports container without title", () => {
    const md = `::: info
仅内容
:::`;
    expect(engine().render(md).html).toBe(
      panelHtml("info", "", "<p>仅内容</p>"),
    );
  });

  it("supports multiple inner blocks", () => {
    const md = `::: warning 注意
第一段

第二段
:::`;
    expect(engine().render(md).html).toBe(
      panelHtml("warning", "注意", "<p>第一段</p>\n<p>第二段</p>"),
    );
  });

  it("leaves syntax unchanged when extension disabled", () => {
    const md = `::: tip 标题
内容
:::`;
    expect(base().render(md).html).toBe(
      "<p>::: tip 标题\n内容\n:::</p>\n",
    );
  });
});
