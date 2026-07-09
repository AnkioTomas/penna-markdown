import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("basic asterisk strong", () => {
  const html = renderMarkdown(createEngine(), "**bold**");
  expect(html).toBe("<p><strong>bold</strong></p>\n");
});
