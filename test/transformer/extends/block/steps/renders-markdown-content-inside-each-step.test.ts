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

it("renders markdown content inside each step", () => {
  const html = renderMarkdown(createEnhancedEngine(), sample);
  expect(html).toContain("cherry-code-block");
  expect(html).toContain("console.log('Hello World!')");
  expect(html).toContain("<p>这里是步骤 2 的相关内容</p>");
  expect(html).toContain('<div class="cherry-alert cherry-alert--tip">');
  expect(html).toContain("<p>提示容器</p>");
});
