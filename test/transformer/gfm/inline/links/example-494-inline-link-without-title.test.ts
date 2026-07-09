import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 494: Inline link without title", () => {
  const transformer = createEngine();
  const markdown = "[link](/uri)";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html.trim()).toBe('<p><a href="/uri">link</a></p>');
});
