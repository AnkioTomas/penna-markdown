import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 529: link text binds tighter than emphasis", () => {
  const transformer = createEngine();
  const markdown = "*[foo*](/uri)\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p>*<a href="/uri">foo*</a></p>\n');
});
