import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 82: interior blank lines preserve spaces beyond four", () => {
  const input = "    chunk1\n      \n      chunk2\n";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<pre><code>chunk1\n  \n  chunk2\n</code></pre>\n");
});
