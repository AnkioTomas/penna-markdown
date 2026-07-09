import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

function panelHtml(type: string, title: string, body: string) {
  const titleHtml = title
    ? `<p class="cherry-alert__title">${title}</p>\n`
    : "";
  return `<div class="cherry-alert cherry-alert--${type}">\n${titleHtml}${body}\n</div>\n`;
}

function alignHtml(type: string, body: string, title = "") {
  const titleHtml = title
    ? `<p class="cherry-align__title">${title}</p>\n`
    : "";
  return `<div class="cherry-align cherry-align--${type}">\n${titleHtml}${body}\n</div>\n`;
}

it("supports alignment type aliases", () => {
  const engine = () => createEngine();
  const md = `::: l
左
:::`;
  expect(renderMarkdown(createEngine(), md)).toBe(
    alignHtml("left", "<p>左</p>"),
  );
});
