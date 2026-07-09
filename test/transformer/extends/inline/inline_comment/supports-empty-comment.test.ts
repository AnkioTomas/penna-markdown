import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("supports empty comment", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(createEngine(), "前%%%%后");
  expect(html).toBe("<p>前后</p>\n");
});
