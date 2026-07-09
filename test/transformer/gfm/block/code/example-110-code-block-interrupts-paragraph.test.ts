import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 110: code block interrupts paragraph", () => {
  const input = "foo\n```\nbar\n```\nbaz";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<p>foo</p>\n<pre><code>bar\n</code></pre>\n<p>baz</p>\n");
});
