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

it("keeps radio inputs inside nav labels for stable focus", () => {
  const html = renderMarkdown(createEngine(), sample);
  expect(html).toContain(
    '<div class="penna-tabs__nav"><label class="penna-tabs__label">',
  );
  expect(html).toContain('<input type="radio" class="penna-tabs__radio"');
  expect(html).not.toContain('for="penna-tabs-');
});
