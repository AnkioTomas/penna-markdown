import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 493: Inline link with title", () => {
  const transformer = createEngine();
  const markdown = '[link](/uri "title")';
  const html = renderMarkdown(createEngine(), markdown);
  expect(html.trim()).toBe('<p><a href="/uri" title="title">link</a></p>');
});
