import { describe, expect, it } from "vitest";
import { createEngine, createEngineWithExtensions, renderMarkdown } from "../helpers/engine.js";

describe("extends/tabs", () => {
  const engine = () => createEngineWithExtensions(["tabs"]);

  const sample = `::: tabs

@tab 标题 1

tab 1 内容

@tab 标题 2

tab 2 内容

@tab:active 标题 3

tab 3 内容

:::`;

  it("renders tabs with css-only switching markup", () => {
    const html = renderMarkdown(engine(), sample);
    expect(html).toContain('class="cherry-tabs"');
    expect(html).toContain('type="radio"');
    expect(html).toContain('class="cherry-tabs__nav"');
    expect(html).toContain('class="cherry-tabs__panels"');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<style");
  });

  it("renders tab titles and panel content", () => {
    const html = renderMarkdown(engine(), sample);
    expect(html).toContain(">标题 1</label>");
    expect(html).toContain(">标题 2</label>");
    expect(html).toContain(">标题 3</label>");
    expect(html).toContain("<p>tab 1 内容</p>");
    expect(html).toContain("<p>tab 2 内容</p>");
    expect(html).toContain("<p>tab 3 内容</p>");
  });

  it("activates @tab:active panel by default", () => {
    const html = renderMarkdown(engine(), sample);
    expect(html).toMatch(/id="cherry-tabs-\d+-2" checked/);
    expect(html).not.toMatch(/id="cherry-tabs-\d+-0" checked/);
    expect(html).not.toMatch(/id="cherry-tabs-\d+-1" checked/);
  });

  it("defaults to first tab when no :active marker", () => {
    const md = `::: tabs
@tab A
内容 A
@tab B
内容 B
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toMatch(/id="cherry-tabs-\d+-0" checked/);
    expect(html).not.toMatch(/id="cherry-tabs-\d+-1" checked/);
  });

  it("supports markdown inside tab panels", () => {
    const md = `::: tabs
@tab 代码
\`\`\`
console.log(1)
\`\`\`
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain("<pre><code");
    expect(html).toContain("console.log(1)");
  });

  it("supports nested containers inside tab panels", () => {
    const md = `::: tabs
@tab 提示
::: tip 标题
嵌套内容
:::
@tab 其他
正文
:::`;
    const html = renderMarkdown(createEngineWithExtensions(["tabs", "container"]), md);
    expect(html).toContain('<div class="cherry-alert cherry-alert--tip">');
    expect(html).toContain("<p>嵌套内容</p>");
    expect(html).toContain("<p>正文</p>");
  });

  it("is disabled without extension", () => {
    const html = renderMarkdown(createEngine(), `::: tabs
@tab A
内容
:::`);
    expect(html).not.toContain("cherry-tabs");
    expect(html).toContain("@tab A");
  });
});
