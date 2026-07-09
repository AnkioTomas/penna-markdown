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

it("renders card title with inline markdown", () => {
  const engine = () => createEngine();
  const md = `::: card **加粗**标题
内容
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain(
    '<p class="cherry-card__title"><strong>加粗</strong>标题</p>',
  );
});
