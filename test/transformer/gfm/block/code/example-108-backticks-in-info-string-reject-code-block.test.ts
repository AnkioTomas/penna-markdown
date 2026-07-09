import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 108: backticks in info string reject code block", () => {
  const input = "``` ```\naaa";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<p><code> </code>\naaa</p>\n");
});
