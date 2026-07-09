import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 252: Marker line with extra space in code block", () => {
  const input = "1.      indented code\n\n   paragraph\n\n       more code\n";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe(
    "<ol>\n<li>\n<pre><code> indented code\n</code></pre>\n<p>paragraph</p>\n<pre><code>more code\n</code></pre>\n</li>\n</ol>\n",
  );
});
