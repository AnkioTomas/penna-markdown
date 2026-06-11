import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

function cardHtml(title, body, { link = "" } = {}) {
  const titleHtml = title ? `<p class="card-title">${title}</p>\n` : "";
  if (link) {
    return `<a class="card link-card" href="${link}" target="_blank" rel="noopener noreferrer">\n${titleHtml}<div class="card-body">${body}</div>\n</a>\n`;
  }
  return `<div class="card">\n${titleHtml}<div class="card-body">${body}</div>\n</div>\n`;
}

describe("extends/card", () => {
  const engine = () => createTransformerWithExtensions(["card"]);

  it("renders single card with title attribute", () => {
    const md = `::: card 标题

这里是卡片内容。
:::`;
    expect(engine().render(md).html).toBe(
      cardHtml("标题", "<p>这里是卡片内容。</p>"),
    );
  });

  it("renders card title with inline markdown", () => {
    const md = `::: card **加粗**标题
内容
:::`;
    const { html } = engine().render(md);
    expect(html).toContain(
      '<p class="card-title"><strong>加粗</strong>标题</p>',
    );
  });

  it("renders link-card with jump link", () => {
    const md = `::: link-card 文档 link="https://example.com"

点击查看文档详情。
:::`;
    expect(engine().render(md).html).toBe(
      cardHtml("文档", "<p>点击查看文档详情。</p>", {
        link: "https://example.com",
      }),
    );
  });

  it("renders image-card with metadata and description attribute", () => {
    const md = `::: image-card image="https://example.com/photo.webp" title="阿尔凡齐纳灯塔" description="灯塔位于葡萄牙南部海岸。" href="/" author="Andreas Kunz" date="2024/08/16"
:::`;
    const { html } = engine().render(md);
    expect(html).toContain('class="image-card"');
    expect(html).toContain('src="https://example.com/photo.webp"');
    expect(html).toContain('alt="阿尔凡齐纳灯塔"');
    expect(html).toContain(
      '<h3 class="title"><a href="/" target="_blank" rel="noopener noreferrer">阿尔凡齐纳灯塔</a></h3>',
    );
    expect(html).toContain("<span>Andreas Kunz</span>");
    expect(html).toContain("<span>2024/08/16</span>");
    expect(html).toContain(
      '<p class="description">灯塔位于葡萄牙南部海岸。</p>',
    );
  });

  it("renders image-card description from body", () => {
    const md = `::: image-card image="https://example.com/photo.webp" title="标题" author="Alice"
正文描述段落。
:::`;
    const { html } = engine().render(md);
    expect(html).toContain(
      '<div class="description"><p>正文描述段落。</p></div>',
    );
    expect(html).not.toContain('class="card-body"');
  });

  it("renders card grid with default responsive cols", () => {
    const md = `:::: card-grid

::: card A
:::
::: card B
:::

::::`;
    const { html } = engine().render(md);
    expect(html).toContain(
      'class="card-grid" style="--card-grid-cols-sm: 1; --card-grid-cols-md: 2; --card-grid-cols-lg: 2;"',
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
    const { html } = engine().render(md);
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
    const { html } = engine().render(md);
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
    const { html } = engine().render(md);
    expect(html).toContain('class="card-grid"');
    expect(html).toContain('href="https://example.com/1"');
    expect(html).toContain('class="image-card"');
  });

  it("renders repo-card with shields.io badges when repo is provided", () => {
    const md = `::: repo-card vuepress/ecosystem
Official plugins and themes for VuePress2
:::`;
    const { html } = engine().render(md);
    expect(html).toContain('class="repo-card"');
    expect(html).toContain(
      '<a href="https://github.com/vuepress/ecosystem"',
    );
    expect(html).toContain("vuepress/ecosystem");
    expect(html).toContain('<span class="repo-visibility">Public</span>');
    expect(html).toContain(
      '<div class="repo-desc"><p>Official plugins and themes for VuePress2</p></div>',
    );
    expect(html).toContain('class="repo-shield"');
    expect(html).toContain(
      "img.shields.io/github/languages/top/vuepress%2Fecosystem",
    );
    expect(html).toContain("img.shields.io/github/stars/vuepress%2Fecosystem");
    expect(html).toContain("img.shields.io/github/forks/vuepress%2Fecosystem");
    expect(html).toContain("img.shields.io/github/license/vuepress%2Fecosystem");
    expect(html).toContain("/vuepress/ecosystem/graphs/languages");
    expect(html).toContain("repo-shield__img--light");
    expect(html).toContain("repo-shield__img--dark");
    expect(html).toContain("labelColor=f3f4f6");
    expect(html).toContain("labelColor=21262d");
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
    const { html } = engine().render(md);
    expect(html).toContain(
      'class="card-masonry cols-3" style="gap: 16px; --card-masonry-cols: 3;"',
    );
    expect(html).toContain('class="card-masonry-item" style="gap: 16px;"');
    expect(html).toContain('class="masonry-v-6-0"');
    expect(html).toContain('class="masonry-v-6-3"');
    expect(html).toContain('class="masonry-v-6-5"');
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
    const { html } = engine().render(md);
    expect(html).toContain('class="card-masonry cols-2"');
    expect(html).toContain('class="masonry-v-3-0"');
    expect(html).toContain('<p class="card-title">卡片1</p>');
    expect(html).toContain('<p class="card-title">卡片3</p>');
  });

  it("is disabled without extension", () => {
    const md = `::: image-card title="标题"
内容
:::`;
    const { html } = createTransformer().render(md);
    expect(html).not.toContain('class="image-card"');
    expect(html).toContain("::: image-card");
  });
});
