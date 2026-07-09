import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 506: unbalanced parentheses with escapes", () => {
  const transformer = createEngine();
  const markdown = "[link](foo\\(and\\(bar\\))\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p><a href="foo(and(bar)">link</a></p>\n');
});
