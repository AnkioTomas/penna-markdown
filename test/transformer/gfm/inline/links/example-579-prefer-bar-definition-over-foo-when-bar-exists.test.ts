import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 579: prefer bar definition over foo when bar exists", () => {
  const transformer = createEngine();
  const markdown = "[foo][bar][baz]\n\n[baz]: /url1\n[foo]: /url2\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p>[foo]<a href="/url1">bar</a></p>\n');
});
