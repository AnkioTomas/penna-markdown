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

it("supports multiple inner blocks", () => {
  const engine = () => createEngine();
  const md = `::: warning 注意
第一段

第二段
:::`;
  expect(renderMarkdown(createEngine(), md)).toBe(
    panelHtml("warning", "注意", "<p>第一段</p>\n<p>第二段</p>"),
  );
});
