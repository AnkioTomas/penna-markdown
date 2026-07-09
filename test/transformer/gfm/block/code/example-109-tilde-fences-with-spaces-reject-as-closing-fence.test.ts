import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 109: tilde fences with spaces reject as closing fence", () => {
  const input = "~~~~~~\naaa\n~~~ ~~";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<pre><code>aaa\n~~~ ~~\n</code></pre>\n");
});
