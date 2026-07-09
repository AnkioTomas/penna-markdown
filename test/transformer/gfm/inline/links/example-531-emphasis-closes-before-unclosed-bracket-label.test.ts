import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 531: emphasis closes before unclosed bracket label", () => {
  const transformer = createEngine();
  const markdown = "*foo [bar* baz]\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe("<p><em>foo [bar</em> baz]</p>\n");
});
