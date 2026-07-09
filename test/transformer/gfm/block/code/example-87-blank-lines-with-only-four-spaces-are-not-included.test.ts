import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 87: blank lines with only four spaces are not included", () => {
  const input = "\n    \n    foo\n    \n\n";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<pre><code>foo\n</code></pre>\n");
});
