import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("basic underscore emphasis", () => {
  const html = renderMarkdown(createEngine(), "_italic_");
  expect(html).toBe("<p><em>italic</em></p>\n");
});
