import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 577: unmatched full reference yields later full reference", () => {
  const transformer = createEngine();
  const markdown = "[foo][bar][baz]\n\n[baz]: /url\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p>[foo]<a href="/url">bar</a></p>\n');
});
