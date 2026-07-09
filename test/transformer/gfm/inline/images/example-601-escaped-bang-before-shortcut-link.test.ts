import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 601: escaped bang before shortcut link", () => {
  const transformer = createEngine();
  const markdown = '\\![foo]\n\n[foo]: /url "title"\n';
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p>!<a href="/url" title="title">foo</a></p>\n');
});
