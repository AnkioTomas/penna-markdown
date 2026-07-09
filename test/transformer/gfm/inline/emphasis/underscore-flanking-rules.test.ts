import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("underscore flanking rules", () => {
  // Should not match if part of a word
  const html = renderMarkdown(createEngine(), "a_italic_b");
  expect(html).toBe("<p>a_italic_b</p>\n");
});
