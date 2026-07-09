import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 595: collapsed reference image with whitespace", () => {
  const transformer = createEngine();
  const markdown = '![foo] \n[]\n\n[foo]: /url "title"\n';
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p><img src="/url" alt="foo" title="title" />\n[]</p>\n');
});
