import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("basic underscore strong", () => {
  const html = renderMarkdown(createEngine(), "__bold__");
  expect(html).toBe("<p><strong>bold</strong></p>\n");
});
