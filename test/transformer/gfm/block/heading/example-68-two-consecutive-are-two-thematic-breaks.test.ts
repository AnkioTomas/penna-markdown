import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 68: two consecutive --- are two thematic breaks", () => {
  const html = renderMarkdown(createEngine(), "---\n---");
  expect(html).toBe("<hr />\n<hr />\n");
});
