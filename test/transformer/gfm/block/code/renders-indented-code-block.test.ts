import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders indented code block", () => {
  const input = "    line 1\n    line 2";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<pre><code>line 1\nline 2\n</code></pre>\n");
});
