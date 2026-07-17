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

it("does not render as generic container", () => {
  const html = renderMarkdown(createEngine(), sample);
  expect(html).not.toContain("penna-alert--note");
});
