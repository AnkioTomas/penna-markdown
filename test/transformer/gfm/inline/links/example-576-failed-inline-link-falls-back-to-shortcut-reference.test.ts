import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 576: failed inline link falls back to shortcut reference", () => {
  const transformer = createEngine();
  const markdown = "[foo](not a link)\n\n[foo]: /url1\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p><a href="/url1">foo</a>(not a link)</p>\n');
});
