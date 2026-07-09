import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 66: leading --- is thematic break, not frontmatter", () => {
  const html = renderMarkdown(createEngine(), "---\nFoo\n---\nBar\n---\nBaz");
  expect(html).toBe("<hr />\n<h2>Foo</h2>\n<h2>Bar</h2>\n<p>Baz</p>\n");
});
