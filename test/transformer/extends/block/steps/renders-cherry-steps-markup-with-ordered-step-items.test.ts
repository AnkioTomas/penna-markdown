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

it("renders cherry-steps markup with ordered step items", () => {
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
  const html = renderMarkdown(createEngine(), sample);
  expect(html).toContain('<div class="cherry-steps">');
  expect(html).toContain("<ol>");
  expect(html).toContain("<li>");
  expect(html).toContain("<p>步骤 1</p>");
  expect(html).toContain("<p>步骤 2</p>");
  expect(html).toContain("<p>步骤 3</p>");
  expect(html).toContain("<p>结束</p>");
});
