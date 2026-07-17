import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

const engine = () => createEngine();

const sample = `:::: field-group
::: field theme
@type ThemeConfig
@required
@default { base: '/' }
主题配置
:::

::: field enabled
@type boolean
@optional
@default true

是否启用
:::

::: field callback
@type (...args: any[]) => void
@optional
@default () => (){}
[v1.0.0 新增]{.tip}

回调函数
:::

::: field other
@type string
@deprecated

[v0.9.0 弃用]{.danger}

已弃用属性
:::
::::`;

it("does not render as generic container", () => {
  const html = renderMarkdown(createEngine(), sample);
  expect(html).not.toContain("penna-alert--note");
});
