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

it("renders danger container", () => {
  const engine = () => createEngine();
  const md = `::: danger 🚨 危险操作
删除数据库前请务必备份！
:::`;
  expect(renderMarkdown(createEngine(), md)).toBe(
    panelHtml("danger", "🚨 危险操作", "<p>删除数据库前请务必备份！</p>"),
  );
});
