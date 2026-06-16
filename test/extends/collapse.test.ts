import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("extends/collapse", () => {
  const engine = () => createTransformerWithExtensions(["collapse"]);

  const sample = `::: collapse
- 标题 1

  正文内容

- 标题 2

  正文内容
:::`;

  it("renders collapsed panels by default", () => {
    const html = renderMarkdown(engine(), sample);
    expect(html).toContain('<div class="cherry-collapse">');
    expect(html).toContain("<summary>标题 1</summary>");
    expect(html).toContain("<summary>标题 2</summary>");
    expect(html).toContain("<p>正文内容</p>");
    expect(html).not.toContain("<details open>");
    expect(html).not.toContain("cherry-detail");
  });

  it("supports expand container config", () => {
    const md = `::: collapse expand
- 标题 1

  正文内容

- 标题 2

  正文内容
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('<div class="cherry-collapse cherry-collapse--expand">');
    expect(html.match(/<details open>/g)?.length).toBe(2);
  });

  it("supports accordion mode with details name", () => {
    const md = `::: collapse accordion
- 标题 1

  正文内容

- 标题 2

  正文内容
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('<div class="cherry-collapse cherry-collapse--accordion">');
    expect(html).toContain('name="cherry-collapse-1"');
    expect(html).not.toContain("<details open>");
  });

  it("supports :+ marker for expanded items", () => {
    const md = `::: collapse
- 标题 1

  正文内容

- :+ 标题 2

  展开内容

- :+ 标题 3

  也展开
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html.match(/<details open>/g)?.length).toBe(2);
    expect(html).toContain("<summary>标题 2</summary>");
    expect(html).toContain("<p>展开内容</p>");
  });

  it("supports :- marker when expand is set", () => {
    const md = `::: collapse expand
- 标题 1

  正文内容

- :- 标题 2

  折叠内容

- 标题 3

  展开内容
:::`;
    const html = renderMarkdown(engine(), md);
    const openCount = html.match(/<details open>/g)?.length ?? 0;
    expect(openCount).toBe(2);
    expect(html).toContain("<details>\n<summary>标题 2</summary>");
    expect(html).toContain("<details open>\n<summary>标题 3</summary>");
  });

  it("supports multi-line title before content", () => {
    const md = `::: collapse
- 主标题
  副标题

  正文内容
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain("<summary>主标题<br>副标题</summary>");
  });

  it("supports markdown in collapse body", () => {
    const md = `::: collapse expand
- 代码

  \`\`\`
  console.log(1)
  \`\`\`
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain("<pre><code");
    expect(html).toContain("console.log(1)");
  });

  it("does not render as generic container", () => {
    const html = renderMarkdown(engine(), sample);
    expect(html).not.toContain('cherry-alert--note');
  });

  it("is disabled without extension", () => {
    const html = renderMarkdown(createEngine(), sample);
    expect(html).not.toContain("cherry-collapse");
    expect(html).toContain("标题 1");
  });
});
