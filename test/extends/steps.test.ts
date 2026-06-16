import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("extends/steps", () => {
  const engine = () => createTransformerWithExtensions(["steps", "container"]);

  const sample = `::: steps

1. 步骤 1

\`\`\`ts
console.log('Hello World!')
\`\`\`

2. 步骤 2

这里是步骤 2 的相关内容

3. 步骤 3

::: tip 提示
提示容器
:::

4. 结束

:::`;

  it("renders cherry-steps markup with ordered step items", () => {
    const html = renderMarkdown(engine(), sample);
    expect(html).toContain('<div class="cherry-steps">');
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>");
    expect(html).toContain("<p>步骤 1</p>");
    expect(html).toContain("<p>步骤 2</p>");
    expect(html).toContain("<p>步骤 3</p>");
    expect(html).toContain("<p>结束</p>");
  });

  it("renders markdown content inside each step", () => {
    const html = renderMarkdown(engine(), sample);
    expect(html).toContain("<pre><code");
    expect(html).toContain("console.log('Hello World!')");
    expect(html).toContain("<p>这里是步骤 2 的相关内容</p>");
    expect(html).toContain('<div class="cherry-alert cherry-alert--tip">');
    expect(html).toContain("<p>提示容器</p>");
  });

  it("does not render as generic container", () => {
    const html = renderMarkdown(engine(), `::: steps

1. 第一步

内容

:::`);
    expect(html).not.toContain('cherry-alert--note');
    expect(html).toContain("cherry-steps");
  });

  it("is disabled without extension", () => {
    const html = renderMarkdown(createEngine(), `::: steps

1. 第一步

内容

:::`);
    expect(html).not.toContain("cherry-steps");
    expect(html).toContain("第一步");
  });

  it("returns null for empty steps block", () => {
    const html = renderMarkdown(engine(), `::: steps

没有有序列表

:::`);
    expect(html).not.toContain("cherry-steps");
  });
});
