import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 257: Blank marker with spaces before content", () => {
  const html = renderMarkdown(createEngine(), "-   \n  foo\n");
  expect(html).toBe("<ul>\n<li>foo</li>\n</ul>\n");
});
