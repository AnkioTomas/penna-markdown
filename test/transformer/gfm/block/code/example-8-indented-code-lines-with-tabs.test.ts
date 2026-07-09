import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 8: Indented code lines with tabs", () => {
  const input = "    foo\n\tbar";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<pre><code>foo\nbar\n</code></pre>\n");
});
