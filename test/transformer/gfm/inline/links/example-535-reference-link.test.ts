import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 535: Reference link", () => {
  const transformer = createEngine();
  const markdown = '[foo][bar]\n\n[bar]: /url "title"';
  const html = renderMarkdown(createEngine(), markdown);
  expect(html.trim()).toBe('<p><a href="/url" title="title">foo</a></p>');
});
