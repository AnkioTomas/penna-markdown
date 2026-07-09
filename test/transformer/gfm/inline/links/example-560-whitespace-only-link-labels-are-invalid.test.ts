import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 560: whitespace-only link labels are invalid", () => {
  const transformer = createEngine();
  const markdown = "[\n ]\n\n[\n ]: /uri\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe("<p>[\n]</p>\n<p>[\n]: /uri</p>\n");
});
