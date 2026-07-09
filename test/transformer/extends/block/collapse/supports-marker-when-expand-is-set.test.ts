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

it("supports :- marker when expand is set", () => {
  const md = `::: collapse expand
- 标题 1

  正文内容

- :- 标题 2

  折叠内容

- 标题 3

  展开内容
:::`;
  const html = renderMarkdown(createEngine(), md);
  const openCount = html.match(/<details open>/g)?.length ?? 0;
  expect(openCount).toBe(2);
  expect(html).toContain("<details>\n<summary>标题 2</summary>");
  expect(html).toContain("<details open>\n<summary>标题 3</summary>");
});
