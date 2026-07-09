import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 301: Blockquote and fenced code inside list item", () => {
  const md = "- a\n  > b\n  ```\n  c\n  ```\n- d\n";
  const html = renderMarkdown(createEngine(), md);
  expect(html).toBe(
    "<ul>\n<li>a\n<blockquote>\n<p>b</p>\n</blockquote>\n<pre><code>c\n</code></pre>\n</li>\n<li>d</li>\n</ul>\n",
  );
});
