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

it("supports image alias for link-card icon", () => {
  const engine = () => createEngine();
  const md = `::: link-card 封面 image="https://example.com/cover.jpg" link="https://example.com"
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain('class="penna-link-card__icon"');
  expect(html).toContain('src="https://example.com/cover.jpg"');
  expect(html).toContain('<p class="penna-card__title">封面</p>');
});
