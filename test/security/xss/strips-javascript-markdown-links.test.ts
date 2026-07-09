import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../helpers/engine.js";

it("strips javascript: markdown links", () => {
  const engine = () => createEngine();
  const md = "[x](javascript:alert(1))";
  const html = renderMarkdown(createEngine(), md);
  expect(html).toBe("<p>x</p>\n");
});
