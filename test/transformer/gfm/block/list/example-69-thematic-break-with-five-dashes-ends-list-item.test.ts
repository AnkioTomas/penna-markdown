import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 69: Thematic break with five dashes ends list item", () => {
  const html = renderMarkdown(createEngine(), "- foo\n-----\n");
  expect(html).toBe("<ul>\n<li>foo</li>\n</ul>\n<hr />\n");
});
