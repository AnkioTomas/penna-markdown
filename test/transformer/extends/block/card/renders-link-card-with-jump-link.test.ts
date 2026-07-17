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

it("renders link-card with jump link", () => {
  const engine = () => createEngine();
  const md = `::: link-card 文档 link="https://example.com"

点击查看文档详情。
:::`;
  expect(renderMarkdown(createEngine(), md)).toBe(
    cardHtml("文档", "<p>点击查看文档详情。</p>", {
      link: "https://example.com",
    }),
  );
});
