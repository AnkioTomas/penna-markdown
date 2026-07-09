import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 528: nested links in image alt", () => {
  const transformer = createEngine();
  const markdown = "![[[foo](uri1)](uri2)](uri3)\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p><img src="uri3" alt="[foo](uri2)" /></p>\n');
});
