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

it("supports multi-line title before content", () => {
  const md = `::: collapse
- 主标题
  副标题

  正文内容
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain("<summary>主标题<br>副标题</summary>");
});
