import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 263: Empty list item cannot interrupt paragraph", () => {
  const html = renderMarkdown(createEngine(), "foo\n*\n\nfoo\n1.\n");
  expect(html).toBe("<p>foo\n*</p>\n<p>foo\n1.</p>\n");
});
