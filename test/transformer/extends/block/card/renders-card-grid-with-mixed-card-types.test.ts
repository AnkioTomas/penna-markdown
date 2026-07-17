import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

function cardHtml(title, body, { link = "" } = {}) {
  const titleHtml = title ? `<p class="penna-card__title">${title}</p>\n` : "";
  if (link) {
    return `<a class="penna-card penna-link-card" href="${link}" target="_blank" rel="noopener noreferrer">\n${titleHtml}<div class="penna-card__body">${body}</div>\n</a>\n`;
  }
  return `<div class="penna-card">\n${titleHtml}<div class="penna-card__body">${body}</div>\n</div>\n`;
}

it("renders card grid with mixed card types", () => {
  const engine = () => createEngine();
  const md = `:::: card-grid

::: link-card 卡片标题 1 link="https://example.com/1"

卡片一内容。
:::

::: image-card image="https://example.com/a.webp" title="图片卡" href="/"
:::

::::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain('class="penna-card-grid"');
  expect(html).toContain('href="https://example.com/1"');
  expect(html).toContain('class="penna-image-card"');
});
