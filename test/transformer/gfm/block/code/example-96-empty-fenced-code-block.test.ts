import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 96: empty fenced code block", () => {
  const html = renderMarkdown(createEngine(), "```\n```");
  expect(html).toBe("<pre><code></code></pre>\n");
});
