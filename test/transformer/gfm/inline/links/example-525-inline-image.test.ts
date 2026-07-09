import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 525: Inline image", () => {
  const transformer = createEngine();
  const markdown = "![alt](moon.jpg)";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html.trim()).toBe('<p><img src="moon.jpg" alt="alt" /></p>');
});
