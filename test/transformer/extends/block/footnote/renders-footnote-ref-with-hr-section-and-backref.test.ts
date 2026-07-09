import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

const FOOTNOTES_TAIL = `<div class="cherry-footnotes">
<hr class="cherry-footnotes__sep">
<section class="cherry-footnotes__section">
<ol class="cherry-footnotes__list">
<li id="footnote-1" class="cherry-footnote-item"><p>这里是放在文章末尾的详细解释，点击数字可以自动跳转。 <a href="#footnote-ref-1" class="cherry-footnote-backref" aria-label="返回引用">↩︎</a></p></li>
</ol>
</section>
</div>`;

it("renders footnote ref with hr section and backref", () => {
  const engine = () => createEngine();
  const md = `这是一个需要解释的专业词汇[^1]。

[^1]: 这里是放在文章末尾的详细解释，点击数字可以自动跳转。`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toBe(
    `<p>这是一个需要解释的专业词汇<sup class="cherry-footnote-ref"><a href="#footnote-1" id="footnote-ref-1">1</a></sup>。</p>\n${FOOTNOTES_TAIL}\n`,
  );
});
