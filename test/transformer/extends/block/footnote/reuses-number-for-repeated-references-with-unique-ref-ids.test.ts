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

it("reuses number for repeated references with unique ref ids", () => {
  const engine = () => createEngine();
  const md = `A[^n] and B[^n].

[^n]: Same note.`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain('id="footnote-ref-1"');
  expect(html).toContain('id="footnote-ref-1-2"');
  expect(html).toContain(
    'href="#footnote-ref-1" class="penna-footnote-backref"',
  );
  expect(html.match(/class="penna-footnote-item"/g)?.length).toBe(1);
});
