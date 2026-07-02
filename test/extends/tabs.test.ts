import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

describe("extends/tabs", () => {
  const engine = () => createEngine();

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

  it("keeps radio inputs inside nav labels for stable focus", () => {
    const html = renderMarkdown(engine(), sample);
    expect(html).toContain('<div class="cherry-tabs__nav"><label class="cherry-tabs__label">');
    expect(html).toContain('<input type="radio" class="cherry-tabs__radio"');
    expect(html).not.toContain('for="cherry-tabs-');
  });

  it("activates @tab:active panel by default", () => {
    const html = renderMarkdown(engine(), sample);
    expect(html).toMatch(
      /<label class="cherry-tabs__label">\s*<input type="radio" class="cherry-tabs__radio" name="cherry-tabs-\d+"[^>]*>\s*标题 1\s*<\/label>/,
    );
    expect(html).toMatch(
      /<label class="cherry-tabs__label">\s*<input type="radio" class="cherry-tabs__radio" name="cherry-tabs-\d+" checked>\s*标题 3\s*<\/label>/,
    );
    expect(html).not.toMatch(/<input[^>]+checked[^>]+>\s*标题 1\s*<\/label>/);
    expect(html).not.toMatch(/<input[^>]+checked[^>]+>\s*标题 2\s*<\/label>/);
  });

  it("defaults to first tab when no :active marker", () => {
    const md = `::: tabs
@tab A
内容 A
@tab B
内容 B
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toMatch(
      /<label class="cherry-tabs__label">\s*<input type="radio" class="cherry-tabs__radio" name="cherry-tabs-\d+" checked>\s*A\s*<\/label>/,
    );
    expect(html).not.toMatch(/<input[^>]+checked[^>]+>\s*B\s*<\/label>/);
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
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('<div class="cherry-alert cherry-alert--tip">');
    expect(html).toContain("<p>嵌套内容</p>");
    expect(html).toContain("<p>正文</p>");
  });
});
