import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 496: Inline link with empty brackets", () => {
  const transformer = createEngine();
  const markdown = "[link](<>)";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html.trim()).toBe('<p><a href="">link</a></p>');
});
