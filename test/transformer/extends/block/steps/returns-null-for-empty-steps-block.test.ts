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

it("returns null for empty steps block", () => {
  const html = renderMarkdown(
    engine(),
    `::: steps

没有有序列表

:::`,
  );
  expect(html).not.toContain("cherry-steps");
});
