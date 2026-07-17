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

it("activates @tab:active panel by default", () => {
  const html = renderMarkdown(createEngine(), sample);
  expect(html).toMatch(
    /<label class="penna-tabs__label">\s*<input type="radio" class="penna-tabs__radio" name="penna-tabs-\d+"[^>]*>\s*标题 1\s*<\/label>/,
  );
  expect(html).toMatch(
    /<label class="penna-tabs__label">\s*<input type="radio" class="penna-tabs__radio" name="penna-tabs-\d+" checked>\s*标题 3\s*<\/label>/,
  );
  expect(html).not.toMatch(/<input[^>]+checked[^>]+>\s*标题 1\s*<\/label>/);
  expect(html).not.toMatch(/<input[^>]+checked[^>]+>\s*标题 2\s*<\/label>/);
});
