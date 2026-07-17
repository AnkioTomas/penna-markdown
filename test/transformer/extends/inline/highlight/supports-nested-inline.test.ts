import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("supports nested inline", () => {
  const t = createEngine();
  expect(renderMarkdown(createEngine(), "==**bold**==")).toBe(
    '<p><mark class="penna-mark"><strong>bold</strong></mark></p>\n',
  );
});
