import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 261: Empty ordered list item", () => {
  const html = renderMarkdown(createEngine(), "1. foo\n2.\n3. bar\n");
  expect(html).toBe("<ol>\n<li>foo</li>\n<li></li>\n<li>bar</li>\n</ol>\n");
});
