import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("does not hang on unclosed highlight at strong-break opener", () => {
  const t = createEngine();
  expect(renderMarkdown(createEngine(), "==重要={.important}")).toBe(
    "<p>==重要=</p>\n",
  );
});
