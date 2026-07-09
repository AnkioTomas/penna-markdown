import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

function cardHtml(title, body, { link = "" } = {}) {
  const titleHtml = title ? `<p class="cherry-card__title">${title}</p>\n` : "";
  if (link) {
    return `<a class="cherry-card cherry-link-card" href="${link}" target="_blank" rel="noopener noreferrer">\n${titleHtml}<div class="cherry-card__body">${body}</div>\n</a>\n`;
  }
  return `<div class="cherry-card">\n${titleHtml}<div class="cherry-card__body">${body}</div>\n</div>\n`;
}

it("renders card masonry with nested cards", () => {
  const engine = () => createEngine();
  const md = `:::: card-masonry cols="2" gap="12"

::: card 卡片1
内容一
:::

::: card 卡片2
内容二
:::

::: card 卡片3
内容三
:::

::::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain(
    'class="cherry-card-masonry cherry-card-masonry--cols-2"',
  );
  expect(html).toContain('class="cherry-card-masonry__v-5-0"');
  expect(html).toContain('<p class="cherry-card__title">卡片1</p>');
  expect(html).toContain('<p class="cherry-card__title">卡片3</p>');
});
