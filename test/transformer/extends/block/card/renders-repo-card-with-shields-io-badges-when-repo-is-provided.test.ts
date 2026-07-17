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

it("renders repo-card with shields.io badges when repo is provided", () => {
  const engine = () => createEngine();
  const md = `::: repo-card vuepress/ecosystem
Official plugins and themes for VuePress2
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain('class="penna-repo-card"');
  expect(html).toContain('<a href="https://github.com/vuepress/ecosystem"');
  expect(html).toContain("vuepress/ecosystem");
  expect(html).toContain(
    '<span class="penna-repo-card__visibility">Public</span>',
  );
  expect(html).toContain(
    '<div class="penna-repo-card__desc"><p>Official plugins and themes for VuePress2</p></div>',
  );
  expect(html).toContain(
    'class="penna-repo-card__shield penna-repo-card__shield--stars"',
  );
  expect(html).toContain(
    "img.shields.io/github/languages/top/vuepress%2Fecosystem",
  );
  expect(html).toContain("img.shields.io/github/stars/vuepress%2Fecosystem");
  expect(html).toContain("img.shields.io/github/forks/vuepress%2Fecosystem");
  expect(html).toContain("img.shields.io/github/license/vuepress%2Fecosystem");
  expect(html).toContain("/vuepress/ecosystem/graphs/languages");
  expect(html).toContain('class="penna-repo-card__shield-img"');
  expect(html).toContain("style=flat");
  expect(html).not.toContain("labelColor=");
  expect(html).not.toContain("logoColor=");
});
