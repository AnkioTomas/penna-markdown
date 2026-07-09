import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 6: Blockquote with tab code block", () => {
  const input = ">\t\tfoo";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe(
    "<blockquote>\n<pre><code>  foo\n</code></pre>\n</blockquote>\n",
  );
});
