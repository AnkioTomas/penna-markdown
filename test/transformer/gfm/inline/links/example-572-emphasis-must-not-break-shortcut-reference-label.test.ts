import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 572: emphasis must not break shortcut reference label", () => {
  const transformer = createEngine();
  const markdown = "[foo*]: /url\n\n*[foo*]\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p>*<a href="/url">foo*</a></p>\n');
});
