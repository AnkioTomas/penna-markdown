import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("parses traditional syntax still works", () => {
  const transformer = createEngine();
  const html = renderMarkdown(
    transformer,
    '**bold**{class="highlight" data-a="1"}',
  );
  expect(html).toBe(
    '<p><strong data-a="1" class="highlight">bold</strong></p>\n',
  );
});
