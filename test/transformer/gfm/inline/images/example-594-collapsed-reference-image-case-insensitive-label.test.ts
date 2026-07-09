import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 594: collapsed reference image case-insensitive label", () => {
  const transformer = createEngine();
  const markdown = '![Foo][]\n\n[foo]: /url "title"\n';
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p><img src="/url" alt="Foo" title="title" /></p>\n');
});
