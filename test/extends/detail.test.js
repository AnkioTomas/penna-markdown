import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("extends/detail", () => {
  const engine = () => createTransformerWithExtensions(["detail"]);

  it("renders single collapsed detail", () => {
    const md = `++ 点击展开
隐藏内容
+++`;
    const { html } = engine().render(md);
    expect(html).toBe(
      `<div class="cherry-detail cherry-detail__single">\n<details>\n<summary>点击展开</summary>\n<div class="cherry-detail-body"><p>隐藏内容</p></div>\n</details>\n</div>\n`,
    );
  });

  it("renders single expanded detail with ++-", () => {
    const md = `++- 默认展开
可见内容
+++`;
    const { html } = engine().render(md);
    expect(html).toContain("<details open>");
    expect(html).toContain("<summary>默认展开</summary>");
    expect(html).toContain("<p>可见内容</p>");
  });

  it("renders multiple details in one block", () => {
    const md = `+++ 外层标题
外层内容
++- 默认展开
展开内容
++ 默认收起
收起内容
+++`;
    const { html } = engine().render(md);
    expect(html).toContain('class="cherry-detail cherry-detail__multiple"');
    expect(html).toContain("<summary>外层标题</summary>");
    expect(html).toContain("<p>外层内容</p>");
    expect(html).toContain("<details open>");
    expect(html).toContain("<summary>默认展开</summary>");
    expect(html).toContain("<details>\n<summary>默认收起</summary>");
  });

  it("supports markdown in detail body", () => {
    const md = `++ 代码
\`\`\`
console.log(1)
\`\`\`
+++`;
    const { html } = engine().render(md);
    expect(html).toContain("<pre><code");
    expect(html).toContain("console.log(1)");
  });

  it("is disabled without extension", () => {
    const md = `++ 标题
内容
+++`;
    const { html } = createTransformer().render(md);
    expect(html).not.toContain("cherry-detail");
    expect(html).toContain("++ 标题");
  });
});
