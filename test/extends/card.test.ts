import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

function cardHtml(title, body, { link = "" } = {}) {
  const titleHtml = title ? `<p class="cherry-card__title">${title}</p>\n` : "";
  if (link) {
    return `<a class="cherry-card cherry-link-card" href="${link}" target="_blank" rel="noopener noreferrer">\n${titleHtml}<div class="cherry-card__body">${body}</div>\n</a>\n`;
  }
  return `<div class="cherry-card">\n${titleHtml}<div class="cherry-card__body">${body}</div>\n</div>\n`;
}

describe("extends/card", () => {
  const engine = () => createEngine();

  it("renders single card with title attribute", () => {
    const md = `::: card 标题

这里是卡片内容。
:::`;
    expect(renderMarkdown(engine(), md)).toBe(
      cardHtml("标题", "<p>这里是卡片内容。</p>"),
    );
  });

  it("renders card title with inline markdown", () => {
    const md = `::: card **加粗**标题
内容
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain(
      '<p class="cherry-card__title"><strong>加粗</strong>标题</p>',
    );
  });

  it("renders link-card with jump link", () => {
    const md = `::: link-card 文档 link="https://example.com"

点击查看文档详情。
:::`;
    expect(renderMarkdown(engine(), md)).toBe(
      cardHtml("文档", "<p>点击查看文档详情。</p>", {
        link: "https://example.com",
      }),
    );
  });

  it("renders link-card with left icon image", () => {
    const md = `::: link-card 文档 link="https://example.com" icon="https://example.com/icon.png"

点击查看文档详情。
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toBe(
      `<a class="cherry-card cherry-link-card cherry-link-card--has-icon" href="https://example.com" target="_blank" rel="noopener noreferrer">\n<img class="cherry-link-card__icon" src="https://example.com/icon.png" alt="" loading="lazy">\n<div class="cherry-link-card__main">\n<p class="cherry-card__title">文档</p>\n<div class="cherry-card__body"><p>点击查看文档详情。</p></div>\n</div>\n</a>\n`,
    );
  });

  it("supports image alias for link-card icon", () => {
    const md = `::: link-card 封面 image="https://example.com/cover.jpg" link="https://example.com"
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('class="cherry-link-card__icon"');
    expect(html).toContain('src="https://example.com/cover.jpg"');
    expect(html).toContain('<p class="cherry-card__title">封面</p>');
  });

  it("renders image-card with metadata and description attribute", () => {
    const md = `::: image-card image="https://example.com/photo.webp" title="阿尔凡齐纳灯塔" description="灯塔位于葡萄牙南部海岸。" href="/" author="Andreas Kunz" date="2024/08/16"
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('class="cherry-image-card"');
    expect(html).toContain('src="https://example.com/photo.webp"');
    expect(html).toContain('alt="阿尔凡齐纳灯塔"');
    expect(html).toContain(
      '<h3 class="cherry-image-card__title"><a href="/" target="_blank" rel="noopener noreferrer">阿尔凡齐纳灯塔</a></h3>',
    );
    expect(html).toContain("<span>Andreas Kunz</span>");
    expect(html).toContain("<span>2024/08/16</span>");
    expect(html).toContain(
      '<p class="cherry-image-card__description">灯塔位于葡萄牙南部海岸。</p>',
    );
  });

  it("renders image-card description from body", () => {
    const md = `::: image-card image="https://example.com/photo.webp" title="标题" author="Alice"
正文描述段落。
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain(
      '<div class="cherry-image-card__description"><p>正文描述段落。</p></div>',
    );
    expect(html).not.toContain('class="cherry-card__body"');
  });

  it("renders card grid with default responsive cols", () => {
    const md = `:::: card-grid

::: card A
:::
::: card B
:::

::::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain(
      'class="cherry-card-grid" style="--card-grid-cols-sm: 1; --card-grid-cols-md: 2; --card-grid-cols-lg: 2;"',
    );
  });

  it("renders card grid with uniform cols number", () => {
    const md = `:::: card-grid cols="3"

::: card A
:::
::: card B
:::
::: card C
:::

::::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain(
      'style="--card-grid-cols-sm: 3; --card-grid-cols-md: 3; --card-grid-cols-lg: 3;"',
    );
  });

  it("renders card grid with breakpoint cols object", () => {
    const md = `:::: card-grid cols="{ sm: 1, md: 2, lg: 3 }"

::: card A
:::
::: card B
:::

::::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain(
      'style="--card-grid-cols-sm: 1; --card-grid-cols-md: 2; --card-grid-cols-lg: 3;"',
    );
  });

  it("renders card grid with mixed card types", () => {
    const md = `:::: card-grid

::: link-card 卡片标题 1 link="https://example.com/1"

卡片一内容。
:::

::: image-card image="https://example.com/a.webp" title="图片卡" href="/"
:::

::::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('class="cherry-card-grid"');
    expect(html).toContain('href="https://example.com/1"');
    expect(html).toContain('class="cherry-image-card"');
  });

  it("renders repo-card with shields.io badges when repo is provided", () => {
    const md = `::: repo-card vuepress/ecosystem
Official plugins and themes for VuePress2
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('class="cherry-repo-card"');
    expect(html).toContain(
      '<a href="https://github.com/vuepress/ecosystem"',
    );
    expect(html).toContain("vuepress/ecosystem");
    expect(html).toContain('<span class="cherry-repo-card__visibility">Public</span>');
    expect(html).toContain(
      '<div class="cherry-repo-card__desc"><p>Official plugins and themes for VuePress2</p></div>',
    );
    expect(html).toContain('class="cherry-repo-card__shield cherry-repo-card__shield--stars"');
    expect(html).toContain(
      "img.shields.io/github/languages/top/vuepress%2Fecosystem",
    );
    expect(html).toContain("img.shields.io/github/stars/vuepress%2Fecosystem");
    expect(html).toContain("img.shields.io/github/forks/vuepress%2Fecosystem");
    expect(html).toContain("img.shields.io/github/license/vuepress%2Fecosystem");
    expect(html).toContain("/vuepress/ecosystem/graphs/languages");
    expect(html).toContain('class="cherry-repo-card__shield-img"');
    expect(html).toContain("style=flat");
    expect(html).not.toContain("labelColor=");
    expect(html).not.toContain("logoColor=");
  });

  it("renders card masonry with cols and gap", () => {
    const md = `:::: card-masonry cols="3" gap="16"

![a](https://example.com/1.png)

![b](https://example.com/2.png)

![c](https://example.com/3.png)

![d](https://example.com/4.png)

![e](https://example.com/5.png)

![f](https://example.com/6.png)

::::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain(
      'class="cherry-card-masonry cherry-card-masonry--cols-3" style="gap: 16px; --card-masonry-cols: 3;"',
    );
    expect(html).toContain('class="cherry-card-masonry__item" style="gap: 16px;"');
    expect(html).toContain('class="cherry-card-masonry__v-6-0"');
    expect(html).toContain('class="cherry-card-masonry__v-6-3"');
    expect(html).toContain('class="cherry-card-masonry__v-6-5"');
  });

  it("renders card masonry with nested cards", () => {
    const md = `:::: card-masonry cols="2" gap="12"

::: card 卡片1
内容一
:::

::: card 卡片2
内容二
:::

::: card 卡片3
内容三
:::

::::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('class="cherry-card-masonry cherry-card-masonry--cols-2"');
    expect(html).toContain('class="cherry-card-masonry__v-3-0"');
    expect(html).toContain('<p class="cherry-card__title">卡片1</p>');
    expect(html).toContain('<p class="cherry-card__title">卡片3</p>');
  });

  it("renders image-card with title attribute syntax", () => {
    const md = `::: image-card title="标题"
内容
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('class="cherry-image-card"');
    expect(html).toContain("标题");
  });
});
