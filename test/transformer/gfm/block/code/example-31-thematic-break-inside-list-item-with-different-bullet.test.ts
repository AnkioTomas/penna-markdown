import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 31: Thematic break inside list item with different bullet", () => {
  const input = "- Foo\n- * * *\n";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<ul>\n<li>Foo</li>\n<li>\n<hr />\n</li>\n</ul>\n");
});
