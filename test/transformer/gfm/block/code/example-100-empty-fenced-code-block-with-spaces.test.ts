import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 100: empty fenced code block with spaces", () => {
  const html = renderMarkdown(createEngine(), "```\n```");
  expect(html).toBe("<pre><code></code></pre>\n");
});
