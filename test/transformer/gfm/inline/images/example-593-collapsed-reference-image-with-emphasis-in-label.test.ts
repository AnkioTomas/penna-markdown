import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 593: collapsed reference image with emphasis in label", () => {
  const transformer = createEngine();
  const markdown = '![*foo* bar][]\n\n[*foo* bar]: /url "title"\n';
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p><img src="/url" alt="foo bar" title="title" /></p>\n');
});
