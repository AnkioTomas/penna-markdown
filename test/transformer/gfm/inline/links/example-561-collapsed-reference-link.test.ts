import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 561: Collapsed reference link", () => {
  const transformer = createEngine();
  const markdown = '[foo][]\n\n[foo]: /url "title"';
  const html = renderMarkdown(createEngine(), markdown);
  expect(html.trim()).toBe('<p><a href="/url" title="title">foo</a></p>');
});
