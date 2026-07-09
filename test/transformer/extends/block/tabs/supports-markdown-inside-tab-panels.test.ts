import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

const engine = () => createEngine();

const sample = `::: tabs

@tab 标题 1

tab 1 内容

@tab 标题 2

tab 2 内容

@tab:active 标题 3

tab 3 内容

:::`;

it("supports markdown inside tab panels", () => {
  const md = `::: tabs
@tab 代码
\`\`\`
console.log(1)
\`\`\`
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain("<pre><code");
  expect(html).toContain("console.log(1)");
});
