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

it("renders collapsed panels by default", () => {
  const engine = () => createEngine();
  const sample = `::: collapse
- 标题 1

  正文内容

- 标题 2

  正文内容
:::`;
  const html = renderMarkdown(createEngine(), sample);
  expect(html).toContain('<div class="penna-collapse">');
  expect(html).toContain("<summary>标题 1</summary>");
  expect(html).toContain("<summary>标题 2</summary>");
  expect(html).toContain("<p>正文内容</p>");
  expect(html).not.toContain("<details open>");
  expect(html).not.toContain("penna-detail");
});
