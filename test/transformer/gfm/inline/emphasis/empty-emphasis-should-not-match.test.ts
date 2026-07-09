import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("empty emphasis should not match", () => {
  const html = renderMarkdown(createEngine(), "**"); // Single asterisks don't match if empty inner
  expect(html).toBe("<p>**</p>\n");
  const html2 = renderMarkdown(createEngine(), "__");
  expect(html2).toBe("<p>__</p>\n");
});
