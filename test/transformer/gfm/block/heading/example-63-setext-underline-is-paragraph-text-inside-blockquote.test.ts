import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 63: setext underline is paragraph text inside blockquote", () => {
  const html = renderMarkdown(createEngine(), "> foo\nbar\n===\n");
  expect(html).toBe("<blockquote>\n<p>foo\nbar\n===</p>\n</blockquote>\n");
});
