import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

function panelHtml(type: string, title: string, body: string) {
  const titleHtml = title ? `<p class="penna-alert__title">${title}</p>\n` : "";
  return `<div class="penna-alert penna-alert--${type}">\n${titleHtml}${body}\n</div>\n`;
}

function alignHtml(type: string, body: string, title = "") {
  const titleHtml = title ? `<p class="penna-align__title">${title}</p>\n` : "";
  return `<div class="penna-align penna-align--${type}">\n${titleHtml}${body}\n</div>\n`;
}

it("renders left alignment", () => {
  const engine = () => createEngine();
  const md = `::: left
左对齐的内容
:::`;
  expect(renderMarkdown(createEngine(), md)).toBe(
    alignHtml("left", "<p>左对齐的内容</p>"),
  );
});
