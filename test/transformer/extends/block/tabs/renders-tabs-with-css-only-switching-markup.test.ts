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

it("renders tabs with css-only switching markup", () => {
  const engine = () => createEngine();
  const sample = `::: tabs

@tab 标题 1

tab 1 内容

@tab 标题 2

tab 2 内容

@tab:active 标题 3

tab 3 内容

:::`;
  const html = renderMarkdown(createEngine(), sample);
  expect(html).toContain('class="cherry-tabs"');
  expect(html).toContain('type="radio"');
  expect(html).toContain('class="cherry-tabs__nav"');
  expect(html).toContain('class="cherry-tabs__panels"');
  expect(html).not.toContain("<script");
  expect(html).not.toContain("<style");
});
