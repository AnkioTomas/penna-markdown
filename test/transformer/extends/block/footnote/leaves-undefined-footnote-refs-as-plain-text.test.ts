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

it("leaves undefined footnote refs as plain text", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(createEngine(), "missing[^x] here.");
  expect(html).toBe("<p>missing[^x] here.</p>\n");
});
