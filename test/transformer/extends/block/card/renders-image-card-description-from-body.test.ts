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

it("renders image-card description from body", () => {
  const engine = () => createEngine();
  const md = `::: image-card image="https://example.com/photo.webp" title="标题" author="Alice"
正文描述段落。
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain(
    '<div class="penna-image-card__description"><p>正文描述段落。</p></div>',
  );
  expect(html).not.toContain('class="penna-card__body"');
});
