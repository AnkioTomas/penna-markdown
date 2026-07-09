import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 518: inline link with whitespace and line break in destination", () => {
  const transformer = createEngine();
  const markdown = '[link](   /uri\n  "title"  )\n';
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p><a href="/uri" title="title">link</a></p>\n');
});
