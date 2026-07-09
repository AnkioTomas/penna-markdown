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

it("supports expand container config", () => {
  const md = `::: collapse expand
- 标题 1

  正文内容

- 标题 2

  正文内容
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain(
    '<div class="cherry-collapse cherry-collapse--expand">',
  );
  expect(html.match(/<details open>/g)?.length).toBe(2);
});
