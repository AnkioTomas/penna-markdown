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

it("renders image-card with metadata and description attribute", () => {
  const engine = () => createEngine();
  const md = `::: image-card image="https://example.com/photo.webp" title="阿尔凡齐纳灯塔" description="灯塔位于葡萄牙南部海岸。" href="/" author="Andreas Kunz" date="2024/08/16"
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain('class="cherry-image-card"');
  expect(html).toContain('src="https://example.com/photo.webp"');
  expect(html).toContain('alt="阿尔凡齐纳灯塔"');
  expect(html).toContain(
    '<h3 class="cherry-image-card__title"><a href="/" target="_blank" rel="noopener noreferrer">阿尔凡齐纳灯塔</a></h3>',
  );
  expect(html).toContain("<span>Andreas Kunz</span>");
  expect(html).toContain("<span>2024/08/16</span>");
  expect(html).toContain(
    '<p class="cherry-image-card__description">灯塔位于葡萄牙南部海岸。</p>',
  );
});
