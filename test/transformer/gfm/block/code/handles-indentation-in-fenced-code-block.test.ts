import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("handles indentation in fenced code block", () => {
  const input = "  ```\n  line 1\n  line 2\n  ```";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<pre><code>line 1\nline 2\n</code></pre>\n");
});
