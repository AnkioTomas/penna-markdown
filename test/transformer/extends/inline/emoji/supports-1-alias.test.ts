import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("supports :+1: alias", () => {
  const t = createEngine();
  expect(renderMarkdown(createEngine(), ":+1:")).toBe("<p>👍</p>\n");
});
