import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("parses simplified .class syntax", () => {
  const transformer = createEngine();
  const html = renderMarkdown(createEngine(), "**bold**{.highlight}");
  expect(html).toBe('<p><strong class="highlight">bold</strong></p>\n');
});
