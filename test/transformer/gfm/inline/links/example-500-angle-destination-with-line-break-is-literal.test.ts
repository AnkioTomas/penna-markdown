import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 500: angle destination with line break is literal", () => {
  const transformer = createEngine();
  const markdown = "[link](<foo\nbar>)\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe("<p>[link](<foo\nbar>)</p>\n");
});
