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

it("supports :+ marker for expanded items", () => {
  const md = `::: collapse
- 标题 1

  正文内容

- :+ 标题 2

  展开内容

- :+ 标题 3

  也展开
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html.match(/<details open>/g)?.length).toBe(2);
  expect(html).toContain("<summary>标题 2</summary>");
  expect(html).toContain("<p>展开内容</p>");
});
