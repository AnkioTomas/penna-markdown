import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("supports escaped colon", () => {
  const t = createEngine();
  expect(renderMarkdown(createEngine(), "\\:smile:")).toBe("<p>:smile:</p>\n");
});
