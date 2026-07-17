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

it("renders center alignment", () => {
  const engine = () => createEngine();
  const md = `::: center
居中的内容
:::`;
  expect(renderMarkdown(createEngine(), md)).toBe(
    alignHtml("center", "<p>居中的内容</p>"),
  );
});
