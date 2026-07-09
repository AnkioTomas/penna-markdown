import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 254: Insufficient indent after blank ends list item", () => {
  const html = renderMarkdown(createEngine(), "-    foo\n\n  bar\n");
  expect(html).toBe("<ul>\n<li>foo</li>\n</ul>\n<p>bar</p>\n");
});
