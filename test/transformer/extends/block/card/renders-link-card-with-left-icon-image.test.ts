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

it("renders link-card with left icon image", () => {
  const engine = () => createEngine();
  const md = `::: link-card 文档 link="https://example.com" icon="https://example.com/icon.png"

点击查看文档详情。
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toBe(
    `<a class="penna-card penna-link-card penna-link-card--has-icon" href="https://example.com" target="_blank" rel="noopener noreferrer">\n<img class="penna-link-card__icon" src="https://example.com/icon.png" alt="" loading="lazy">\n<div class="penna-link-card__main">\n<p class="penna-card__title">文档</p>\n<div class="penna-card__body"><p>点击查看文档详情。</p></div>\n</div>\n</a>\n`,
  );
});
