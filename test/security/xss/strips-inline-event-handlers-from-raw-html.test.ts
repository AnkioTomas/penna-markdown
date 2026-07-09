import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../helpers/engine.js";

it("strips inline event handlers from raw HTML", () => {
  const engine = () => createEngine();
  const md = '<img src="x" onerror="alert(1)">';
  const html = renderMarkdown(createEngine(), md);
  expect(html).not.toContain("onerror");
  expect(html).toContain("<img");
});
