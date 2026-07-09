import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 258: Blank line after empty marker ends the item", () => {
  const html = renderMarkdown(createEngine(), "-\n\n  foo\n");
  expect(html).toBe("<ul>\n<li></li>\n</ul>\n<p>foo</p>\n");
});
