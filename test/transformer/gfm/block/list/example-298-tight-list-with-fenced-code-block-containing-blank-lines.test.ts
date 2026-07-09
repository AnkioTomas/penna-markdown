import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 298: Tight list with fenced code block containing blank lines", () => {
  const html = renderMarkdown(
    createEngine(),
    "- a\n- ```\n  b\n\n\n  ```\n- c\n",
  );
  expect(html).toBe(
    "<ul>\n<li>a</li>\n<li>\n<pre><code>b\n\n\n</code></pre>\n</li>\n<li>c</li>\n</ul>\n",
  );
});
