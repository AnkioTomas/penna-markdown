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

it("renders card masonry with cols and gap", () => {
  const engine = () => createEngine();
  const md = `:::: card-masonry cols="3" gap="16"

![a](https://example.com/1.png)

![b](https://example.com/2.png)

![c](https://example.com/3.png)

![d](https://example.com/4.png)

![e](https://example.com/5.png)

![f](https://example.com/6.png)

::::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain(
    'class="cherry-card-masonry cherry-card-masonry--cols-3" style="gap: 16px; --card-masonry-cols: 3;"',
  );
  expect(html).toContain(
    'class="cherry-card-masonry__item" style="gap: 16px;"',
  );
  expect(html).toContain('class="cherry-card-masonry__v-11-0"');
  expect(html).toContain('class="cherry-card-masonry__v-11-3"');
  expect(html).toContain('class="cherry-card-masonry__v-11-5"');
});
