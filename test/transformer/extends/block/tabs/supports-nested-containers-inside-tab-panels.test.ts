import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

const engine = () => createEngine();

const sample = `::: tabs

@tab 标题 1

tab 1 内容

@tab 标题 2

tab 2 内容

@tab:active 标题 3

tab 3 内容

:::`;

it("supports nested containers inside tab panels", () => {
  const md = `::: tabs
@tab 提示
::: tip 标题
嵌套内容
:::
@tab 其他
正文
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain('<div class="cherry-alert cherry-alert--tip">');
  expect(html).toContain("<p>嵌套内容</p>");
  expect(html).toContain("<p>正文</p>");
});
