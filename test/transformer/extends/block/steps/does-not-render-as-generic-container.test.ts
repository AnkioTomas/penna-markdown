import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

const engine = () => createEnhancedEngine();

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

it("does not render as generic container", () => {
  const html = renderMarkdown(
    engine(),
    `::: steps

1. 第一步

内容

:::`,
  );
  expect(html).not.toContain("cherry-alert--note");
  expect(html).toContain("cherry-steps");
});
