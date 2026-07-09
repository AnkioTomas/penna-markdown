import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

const engine = () => createEngine();

const sample = `::: collapse
- 标题 1

  正文内容

- 标题 2

  正文内容
:::`;

it("supports markdown in collapse body", () => {
  const md = `::: collapse expand
- 代码

  \`\`\`
  console.log(1)
  \`\`\`
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain("<pre><code");
  expect(html).toContain("console.log(1)");
});
