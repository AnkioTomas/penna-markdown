import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("extends/field", () => {
  const engine = () =>
    createTransformerWithExtensions(["field", "badge", "html_attrs"]);

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
    const { html } = engine().render(sample);
    expect(html).toContain('<div class="cherry-field-group">');
    expect(html).toContain('<div class="cherry-field required">');
    expect(html).toContain('<div class="field-head">');
    expect(html).toContain('<span class="name">theme</span>');
    expect(html).toContain('<span class="required">Required</span>');
    expect(html).toContain('<span class="type"><code>ThemeConfig</code></span>');
    expect(html).toContain('<p class="default-value"><code>{ base: \'/\' }</code></p>');
    expect(html).toContain("<p>是否启用</p>");
    expect(html).toContain(
      "<code>(...args: any[]) =&gt; void</code>",
    );
    expect(html).toContain('<span class="badge tip">v1.0.0 新增</span>');
    expect(html).toContain('<span class="badge danger">v0.9.0 弃用</span>');
    expect(html).toContain("<p>已弃用属性</p>");
    expect(html).not.toContain("<Badge");
  });

  it("renders standalone field block", () => {
    const md = `::: field title
@type string
@required
标题字段
:::`;
    const { html } = engine().render(md);
    expect(html).toContain('<div class="cherry-field required">');
    expect(html).toContain('<span class="name">title</span>');
    expect(html).not.toContain("cherry-field-group");
  });

  it("does not render as generic container", () => {
    const { html } = engine().render(sample);
    expect(html).not.toContain('class="alert note"');
  });

  it("is disabled without extension", () => {
    const { html } = createTransformer().render(sample);
    expect(html).not.toContain("cherry-field-group");
    expect(html).toContain("@type ThemeConfig");
  });
});
