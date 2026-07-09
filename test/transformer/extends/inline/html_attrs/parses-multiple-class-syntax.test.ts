import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("parses multiple .class syntax", () => {
  const transformer = createEngine();
  const html = renderMarkdown(createEngine(), "**bold**{.a .b .c}");
  expect(html).toBe('<p><strong class="a b c">bold</strong></p>\n');
});
