import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 215: omitting > on fenced code continuation ends blockquote", () => {
  const html = renderMarkdown(createEngine(), "> ```\nfoo\n```\n");
  expect(html).toBe(
    "<blockquote>\n<pre><code></code></pre>\n</blockquote>\n<p>foo</p>\n<pre><code></code></pre>\n",
  );
});
