import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("does not conflict with strikethrough", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(createEngine(), "~~删除~~");
  expect(html).toBe("<p><del>删除</del></p>\n");
});
