import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 85: indented code after headings and setext", () => {
  const input = "# Heading\n    foo\nHeading\n------\n    foo\n----\n";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe(
    "<h1>Heading</h1>\n<pre><code>foo\n</code></pre>\n<h2>Heading</h2>\n<pre><code>foo\n</code></pre>\n<hr />\n",
  );
});
