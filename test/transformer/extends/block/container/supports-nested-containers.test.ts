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

it("supports nested containers", () => {
  const engine = () => createEngine();
  const md = `::: tip 外层
::: info 内层
嵌套正文
:::
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain('<div class="cherry-alert cherry-alert--tip">');
  expect(html).toContain('<div class="cherry-alert cherry-alert--info">');
  expect(html).toContain("<p>嵌套正文</p>");
});
