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

it("supports inline markdown in title", () => {
  const engine = () => createEngine();
  const md = `::: note **粗体**标题
正文
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain("<strong>粗体</strong>标题");
});
