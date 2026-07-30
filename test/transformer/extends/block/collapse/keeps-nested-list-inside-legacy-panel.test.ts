import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("keeps an indented list inside the legacy panel body", () => {
  const md = `::: collapse
- 标题 1

  - 子项 A
  - 子项 B

- 标题 2

  正文
:::`;
  const html = renderMarkdown(createEngine(), md);

  expect(html.match(/<details/g)?.length).toBe(2);
  expect(html).toContain("<summary>标题 1</summary>");
  expect(html).toContain("<li>子项 A</li>");
  expect(html).not.toContain("<summary>子项 A</summary>");
});
