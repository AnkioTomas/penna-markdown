import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 64: Thematic break ends list item", () => {
  const html = renderMarkdown(createEngine(), "- Foo\n---\n");
  expect(html).toBe("<ul>\n<li>Foo</li>\n</ul>\n<hr />\n");
});
