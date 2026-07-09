import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("supports combined simplified and traditional syntax", () => {
  const transformer = createEngine();
  const html = renderMarkdown(
    createEngine(),
    '**bold**{#id .class data-x="1"}',
  );
  expect(html).toBe(
    '<p><strong id="id" data-x="1" class="class">bold</strong></p>\n',
  );
});
