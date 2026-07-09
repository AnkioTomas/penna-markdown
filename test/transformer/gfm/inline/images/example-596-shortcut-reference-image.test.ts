import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 596: shortcut reference image", () => {
  const transformer = createEngine();
  const markdown = '![foo]\n\n[foo]: /url "title"\n';
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p><img src="/url" alt="foo" title="title" /></p>\n');
});
