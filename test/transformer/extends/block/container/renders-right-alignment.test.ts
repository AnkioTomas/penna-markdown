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

it("renders right alignment", () => {
  const engine = () => createEngine();
  const md = `::: right
右对齐的内容
:::`;
  expect(renderMarkdown(createEngine(), md)).toBe(
    alignHtml("right", "<p>右对齐的内容</p>"),
  );
});
