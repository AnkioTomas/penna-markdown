import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 504: escaped parentheses in destination", () => {
  const transformer = createEngine();
  const markdown = "[link](\\(foo\\))\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p><a href="(foo)">link</a></p>\n');
});
