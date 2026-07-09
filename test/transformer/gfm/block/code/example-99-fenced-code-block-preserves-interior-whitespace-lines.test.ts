import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 99: fenced code block preserves interior whitespace lines", () => {
  const input = "```\n\n  \n```\n";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<pre><code>\n  \n</code></pre>\n");
});
