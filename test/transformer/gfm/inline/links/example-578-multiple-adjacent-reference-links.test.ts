import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 578: multiple adjacent reference links", () => {
  const transformer = createEngine();
  const markdown = "[foo][bar][baz]\n\n[baz]: /url1\n[bar]: /url2\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p><a href="/url2">foo</a><a href="/url1">baz</a></p>\n');
});
