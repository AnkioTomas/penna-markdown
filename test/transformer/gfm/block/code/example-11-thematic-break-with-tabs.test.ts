import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 11: Thematic break with tabs", () => {
  const input = "*\t*\t*\t";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<hr />\n");
});
