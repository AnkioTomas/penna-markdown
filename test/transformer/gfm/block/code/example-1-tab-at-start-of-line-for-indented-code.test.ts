import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 1: Tab at start of line for indented code", () => {
  const input = "\tfoo\tbaz\t\tbim";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<pre><code>foo\tbaz\t\tbim\n</code></pre>\n");
});
