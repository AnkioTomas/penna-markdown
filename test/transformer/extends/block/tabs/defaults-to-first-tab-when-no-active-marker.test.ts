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

it("defaults to first tab when no :active marker", () => {
  const md = `::: tabs
@tab A
内容 A
@tab B
内容 B
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toMatch(
    /<label class="penna-tabs__label">\s*<input type="radio" class="penna-tabs__radio" name="penna-tabs-\d+" checked>\s*A\s*<\/label>/,
  );
  expect(html).not.toMatch(/<input[^>]+checked[^>]+>\s*B\s*<\/label>/);
});
