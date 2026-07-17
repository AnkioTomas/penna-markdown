import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

const FOOTNOTES_TAIL = `<div class="penna-footnotes">
<hr class="penna-footnotes__sep">
<section class="penna-footnotes__section">
<ol class="penna-footnotes__list">
<li id="footnote-1" class="penna-footnote-item"><p>这里是放在文章末尾的详细解释，点击数字可以自动跳转。 <a href="#footnote-ref-1" class="penna-footnote-backref" aria-label="返回引用">↩︎</a></p></li>
</ol>
</section>
</div>`;

it("orders footnotes by first reference appearance", () => {
  const engine = () => createEngine();
  const md = `Second[^b] first[^a].

[^a]: A note.
[^b]: B note.`;
  const html = renderMarkdown(createEngine(), md);
  const fn1 = html.indexOf('id="footnote-1"');
  const fn2 = html.indexOf('id="footnote-2"');
  expect(html.indexOf("B note.", fn1)).toBeLessThan(fn2);
  expect(html.indexOf("A note.", fn2)).toBeGreaterThan(fn1);
});
