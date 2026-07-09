import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("parses mixed #id and .class syntax", () => {
  const transformer = createEngine();
  const html = renderMarkdown(createEngine(), "**bold**{#id .class}");
  expect(html).toBe('<p><strong id="id" class="class">bold</strong></p>\n');
});
