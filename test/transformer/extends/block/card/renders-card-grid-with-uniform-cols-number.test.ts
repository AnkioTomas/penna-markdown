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

it("renders card grid with uniform cols number", () => {
  const engine = () => createEngine();
  const md = `:::: card-grid cols="3"

::: card A
:::
::: card B
:::
::: card C
:::

::::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain(
    'style="--card-grid-cols-sm: 3; --card-grid-cols-md: 3; --card-grid-cols-lg: 3;"',
  );
});
