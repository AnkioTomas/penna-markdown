import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 262: List of one empty item", () => {
  const html = renderMarkdown(createEngine(), "*\n");
  expect(html).toBe("<ul>\n<li></li>\n</ul>\n");
});
