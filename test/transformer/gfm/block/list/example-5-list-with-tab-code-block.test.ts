import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 5: List with tab code block", () => {
  const input = "- foo\n\n\t\tbar";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toContain("<p>foo</p>");
  expect(html).toContain("<pre><code>  bar\n</code></pre>");
});
