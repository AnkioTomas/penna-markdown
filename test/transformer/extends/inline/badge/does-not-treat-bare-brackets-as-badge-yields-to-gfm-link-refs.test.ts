import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("does not treat bare brackets as badge (yields to GFM link refs)", () => {
  const html = renderMarkdown(createEngine(), "状态 [进行中]");
  expect(html).toBe("<p>状态 [进行中]</p>\n");
});
