import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("injects attrs into previous inline tag", () => {
  const transformer = createEngine();
  const html = renderMarkdown(createEngine(), '**bold**{class="x"}');
  expect(html).toBe('<p><strong class="x">bold</strong></p>\n');
});
