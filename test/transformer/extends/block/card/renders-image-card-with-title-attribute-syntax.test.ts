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

it("renders image-card with title attribute syntax", () => {
  const engine = () => createEngine();
  const md = `::: image-card title="标题"
内容
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain('class="penna-image-card"');
  expect(html).toContain("标题");
});
