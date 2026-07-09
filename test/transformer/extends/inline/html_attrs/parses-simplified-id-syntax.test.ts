import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("parses simplified #id syntax", () => {
  const transformer = createEngine();
  const html = renderMarkdown(createEngine(), "**bold**{#special}");
  expect(html).toBe('<p><strong id="special">bold</strong></p>\n');
});
