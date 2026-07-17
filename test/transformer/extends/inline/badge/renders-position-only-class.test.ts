import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders position-only class", () => {
  const html = renderMarkdown(createEngine(), "[内容]{.top}");
  expect(html).toBe('<p><span class="penna-badge top">内容</span></p>\n');
});
