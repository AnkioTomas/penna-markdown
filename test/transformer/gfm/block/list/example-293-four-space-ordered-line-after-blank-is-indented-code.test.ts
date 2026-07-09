import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 293: Four-space ordered line after blank is indented code", () => {
  const input = "1. a\n\n  2. b\n\n    3. c\n";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe(
    "<ol>\n<li>\n<p>a</p>\n</li>\n<li>\n<p>b</p>\n</li>\n</ol>\n<pre><code>3. c\n</code></pre>\n",
  );
});
