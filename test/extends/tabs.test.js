import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("extends/tabs", () => {
  const engine = () => createTransformerWithExtensions(["tabs"]);

  const sample = `::: tabs

@tab 标题 1

tab 1 内容

@tab 标题 2

tab 2 内容

@tab:active 标题 3

tab 3 内容

:::`;

  it("renders tabs with css-only switching markup", () => {
    const { html } = engine().render(sample);
    expect(html).toContain('class="cherry-tabs"');
    expect(html).toContain('type="radio"');
    expect(html).toContain('class="cherry-tabs__nav"');
    expect(html).toContain('class="cherry-tabs__panels"');
    expect(html).not.toContain("<script");
  });

  it("renders tab titles and panel content", () => {
    const { html } = engine().render(sample);
    expect(html).toContain(">标题 1</label>");
    expect(html).toContain(">标题 2</label>");
    expect(html).toContain(">标题 3</label>");
    expect(html).toContain("<p>tab 1 内容</p>");
    expect(html).toContain("<p>tab 2 内容</p>");
    expect(html).toContain("<p>tab 3 内容</p>");
  });

  it("activates @tab:active panel by default", () => {
    const { html } = engine().render(sample);
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
    const { html } = engine().render(md);
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
    const { html } = engine().render(md);
    expect(html).toContain("<pre><code");
    expect(html).toContain("console.log(1)");
  });

  it("is disabled without extension", () => {
    const { html } = createTransformer().render(`::: tabs
@tab A
内容
:::`);
    expect(html).not.toContain("cherry-tabs");
    expect(html).toContain("@tab A");
  });
});
