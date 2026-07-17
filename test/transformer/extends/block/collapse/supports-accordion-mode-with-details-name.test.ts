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

it("supports accordion mode with details name", () => {
  const md = `::: collapse accordion
- 标题 1

  正文内容

- 标题 2

  正文内容
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain(
    '<div class="penna-collapse penna-collapse--accordion">',
  );
  expect(html).toContain('name="penna-collapse-1"');
  expect(html).not.toContain("<details open>");
});
