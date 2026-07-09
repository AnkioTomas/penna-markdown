import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("keeps invalid brace syntax as text", () => {
  const transformer = createEngine();
  const html = renderMarkdown(createEngine(), "{123}");
  expect(html).toBe("<p>{123}</p>\n");
});
