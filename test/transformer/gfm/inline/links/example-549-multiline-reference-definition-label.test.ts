import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 549: multiline reference definition label", () => {
  const transformer = createEngine();
  const markdown = "[Foo\n  bar]: /url\n\n[Baz][Foo bar]\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p><a href="/url">Baz</a></p>\n');
});
