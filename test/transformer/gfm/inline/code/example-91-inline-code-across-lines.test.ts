import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 91: inline code across lines", () => {
  const html = renderMarkdown(createEngine(), "``\nfoo\n``");
  expect(html).toBe("<p><code>foo</code></p>\n");
});
