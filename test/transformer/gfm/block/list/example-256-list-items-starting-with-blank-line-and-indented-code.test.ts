import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 256: List items starting with blank line and indented code", () => {
  const md = "-\n  foo\n-\n  ```\n  bar\n  ```\n-\n      baz\n";
  const html = renderMarkdown(createEngine(), md);
  expect(html).toBe(
    "<ul>\n<li>foo</li>\n<li>\n<pre><code>bar\n</code></pre>\n</li>\n<li>\n<pre><code>baz\n</code></pre>\n</li>\n</ul>\n",
  );
});
