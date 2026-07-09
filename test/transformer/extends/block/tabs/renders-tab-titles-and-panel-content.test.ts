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

it("renders tab titles and panel content", () => {
  const html = renderMarkdown(createEngine(), sample);
  expect(html).toContain(">标题 1</label>");
  expect(html).toContain(">标题 2</label>");
  expect(html).toContain(">标题 3</label>");
  expect(html).toContain("<p>tab 1 内容</p>");
  expect(html).toContain("<p>tab 2 内容</p>");
  expect(html).toContain("<p>tab 3 内容</p>");
});
