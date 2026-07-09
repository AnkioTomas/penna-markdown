import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 328: HTML entities in inline link destination and title", () => {
  const transformer = createEngine();
  const markdown = '[foo](/f&ouml;&ouml; "f&ouml;&ouml;")\n';
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p><a href="/f%C3%B6%C3%B6" title="föö">foo</a></p>\n');
});
