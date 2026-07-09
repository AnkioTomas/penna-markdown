import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 97: closing fence with more backticks than opening fence", () => {
  const input = "`````\n\n```\naaa\n```\n```\n```";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<pre><code>\n```\naaa\n```\n```\n```\n</code></pre>\n");
});
