import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

const FOOTNOTES_TAIL = `<div class="footnotes">
<hr class="footnotes-sep">
<section class="footnotes">
<ol class="footnotes-list">
<li id="footnote-1" class="footnote-item"><p>这里是放在文章末尾的详细解释，点击数字可以自动跳转。 <a href="#footnote-ref-1" class="footnote-backref" aria-label="返回引用">↩︎</a></p></li>
</ol>
</section>
</div>`;

describe("extends/footnote", () => {
  const engine = () => createTransformerWithExtensions(["footnote"]);
  const base = () => createTransformer();

  it("renders footnote ref with hr section and backref", () => {
    const md = `这是一个需要解释的专业词汇[^1]。

[^1]: 这里是放在文章末尾的详细解释，点击数字可以自动跳转。`;
    const { html } = engine().render(md);
    expect(html).toBe(
      `<p>这是一个需要解释的专业词汇<sup class="footnote-ref"><a href="#footnote-1" id="footnote-ref-1">1</a></sup>。</p>\n${FOOTNOTES_TAIL}\n`,
    );
  });

  it("reuses number for repeated references with unique ref ids", () => {
    const md = `A[^n] and B[^n].

[^n]: Same note.`;
    const { html } = engine().render(md);
    expect(html).toContain('id="footnote-ref-1"');
    expect(html).toContain('id="footnote-ref-1-2"');
    expect(html).toContain('href="#footnote-ref-1" class="footnote-backref"');
    expect(html.match(/class="footnote-item"/g)?.length).toBe(1);
  });

  it("orders footnotes by first reference appearance", () => {
    const md = `Second[^b] first[^a].

[^a]: A note.
[^b]: B note.`;
    const { html } = engine().render(md);
    const fn1 = html.indexOf('id="footnote-1"');
    const fn2 = html.indexOf('id="footnote-2"');
    expect(html.indexOf("B note.", fn1)).toBeLessThan(fn2);
    expect(html.indexOf("A note.", fn2)).toBeGreaterThan(fn1);
  });

  it("supports rich markdown in footnote body", () => {
    const md = `诗句[^poem]。

[^poem]: 出自 宋·文天祥 **《过零丁洋》**`;
    const { html } = engine().render(md);
    expect(html).toContain("<strong>《过零丁洋》</strong>");
    expect(html).toContain('class="footnote-backref"');
  });

  it("leaves undefined footnote refs as plain text", () => {
    const { html } = engine().render("missing[^x] here.");
    expect(html).toBe("<p>missing[^x] here.</p>\n");
  });

  it("does not treat definition marker as reference", () => {
    const md = `[^1]: only definition`;
    const { html } = engine().render(md);
    expect(html).toBe("");
  });

  it("is disabled without extension", () => {
    const { html } = base().render("text[^1] only.");
    expect(html).toBe("<p>text[^1] only.</p>\n");
  });
});
