import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders basic fenced code block", () => {
  const html = renderMarkdown(createEngine(), "```\nfoo\nbar\n```");
  expect(html).toBe("<pre><code>foo\nbar\n</code></pre>\n");
});
