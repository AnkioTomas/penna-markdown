import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders warning badge", () => {
  const html = renderMarkdown(createEngine(), "[标签]{.warning}");
  expect(html).toBe('<p><span class="cherry-badge warning">标签</span></p>\n');
});
