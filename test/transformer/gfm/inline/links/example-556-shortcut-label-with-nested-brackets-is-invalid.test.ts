import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 556: shortcut label with nested brackets is invalid", () => {
  const transformer = createEngine();
  const markdown = "[[[foo]]]\n\n[[[foo]]]: /url\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe("<p>[[[foo]]]</p>\n<p>[[[foo]]]: /url</p>\n");
});
