import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("extends/footnote", () => {
  const engine = () => createTransformerWithExtensions(["footnote"]);
  const base = () => createTransformer();

  it("renders footnote ref with backlink section", () => {
    const md = `这是一个需要解释的专业词汇[^1]。

[^1]: 这里是放在文章末尾的详细解释，点击数字可以自动跳转。`;
    const { html } = engine().render(md);
    expect(html).toBe(
      `<p>这是一个需要解释的专业词汇<sup><a href="#fn:1" id="fnref:1" class="footnote" title="1">[1]</a></sup>。</p>\n<div class="footnote">\n<div class="footnote-title">脚注</div><div class="one-footnote">\n<a href="#fnref:1" id="fn:1" class="footnote-ref" title="1">[1]</a><p>这里是放在文章末尾的详细解释，点击数字可以自动跳转。</p>\n</div></div>\n`,
    );
  });

  it("reuses number for repeated references", () => {
    const md = `A[^n] and B[^n].

[^n]: Same note.`;
    const { html } = engine().render(md);
    expect(html.match(/id="fnref:1"/g)?.length).toBe(2);
    expect(html.match(/class="one-footnote"/g)?.length).toBe(1);
    expect(html).toContain("A<sup>");
    expect(html).toContain("B<sup>");
  });

  it("orders footnotes by first reference appearance", () => {
    const md = `Second[^b] first[^a].

[^a]: A note.
[^b]: B note.`;
    const { html } = engine().render(md);
    const fn1 = html.indexOf('id="fn:1"');
    const fn2 = html.indexOf('id="fn:2"');
    expect(html.indexOf('title="b"', fn1)).toBeLessThan(fn2);
    expect(html.indexOf('title="a"', fn2)).toBeGreaterThan(fn1);
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
