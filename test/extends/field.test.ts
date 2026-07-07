import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

describe("extends/field", () => {
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

  it("renders field-group with field metadata and descriptions", () => {
    const html = renderMarkdown(engine(), sample);
    expect(html).toContain('<div class="cherry-field-group">');
    expect(html).toContain('<div class="cherry-field cherry-field--required">');
    expect(html).toContain('<div class="cherry-field__head">');
    expect(html).toContain('<span class="cherry-field__name">theme</span>');
    expect(html).toContain(
      '<span class="cherry-field__tag cherry-field__tag--required">Required</span>',
    );
    expect(html).toContain(
      '<span class="cherry-field__type"><code>ThemeConfig</code></span>',
    );
    expect(html).toContain(
      "<p class=\"cherry-field__default\"><code>{ base: '/' }</code></p>",
    );
    expect(html).toContain("<p>是否启用</p>");
    expect(html).toContain("<code>(...args: any[]) =&gt; void</code>");
    expect(html).toContain('<span class="cherry-badge tip">v1.0.0 新增</span>');
    expect(html).toContain(
      '<span class="cherry-badge danger">v0.9.0 弃用</span>',
    );
    expect(html).toContain("<p>已弃用属性</p>");
    expect(html).not.toContain("<Badge");
  });

  it("renders standalone field block", () => {
    const md = `::: field title
@type string
@required
标题字段
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('<div class="cherry-field cherry-field--required">');
    expect(html).toContain('<span class="cherry-field__name">title</span>');
    expect(html).not.toContain("cherry-field-group");
  });

  it("does not render as generic container", () => {
    const html = renderMarkdown(engine(), sample);
    expect(html).not.toContain("cherry-alert--note");
  });
});
