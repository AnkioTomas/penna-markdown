import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 553: escaped punctuation in reference label does not match", () => {
  const transformer = createEngine();
  const markdown = "[bar][foo\\!]\n\n[foo!]: /url\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe("<p>[bar][foo!]</p>\n");
});
