import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("splits panels by @item and keeps lists in the body", () => {
  const md = `::: collapse
@item 面板一
1. 第一步
2. 第二步

- 子列表
  - 更深一层
@item 面板二
正文
:::`;
  const html = renderMarkdown(createEngine(), md);

  expect(html.match(/<details/g)?.length).toBe(2);
  expect(html).toContain("<summary>面板一</summary>");
  expect(html).toContain("<summary>面板二</summary>");
  expect(html).toContain("<ol>");
  expect(html).toContain("<li>更深一层</li>");
});

it("supports @item:open and @item:closed markers", () => {
  const md = `::: collapse expand
@item 跟随容器
正文
@item:closed 强制折叠
正文
@item:open 强制展开
正文
:::`;
  const html = renderMarkdown(createEngine(), md);

  expect(html).toContain("<details open>\n<summary>跟随容器</summary>");
  expect(html).toContain("<details>\n<summary>强制折叠</summary>");
  expect(html).toContain("<details open>\n<summary>强制展开</summary>");
});

it("leaves @item inside a nested collapse to the inner block", () => {
  const md = `::: collapse
@item 外层
::: collapse 内层
@item 内层面板
正文
:::
@item 外层第二项
正文
:::`;
  const html = renderMarkdown(createEngine(), md);

  expect(html).toContain("<summary>外层</summary>");
  expect(html).toContain("<summary>外层第二项</summary>");
  expect(html).toContain("<summary>内层面板</summary>");
});
