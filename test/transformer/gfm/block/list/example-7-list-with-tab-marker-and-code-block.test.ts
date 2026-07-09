import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 7: List with tab marker and code block", () => {
  const input = "-\t\tfoo";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toContain("<pre><code>  foo\n</code></pre>");
});
