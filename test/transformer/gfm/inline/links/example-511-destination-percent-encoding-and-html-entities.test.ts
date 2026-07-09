import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 511: destination percent-encoding and HTML entities", () => {
  const transformer = createEngine();
  const markdown = "[link](foo%20b&auml;)\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p><a href="foo%20b%C3%A4">link</a></p>\n');
});
