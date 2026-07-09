import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders superscript with ^text^", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(createEngine(), "E=mc^2^");
  expect(html).toBe("<p>E=mc<sup>2</sup></p>\n");
});
