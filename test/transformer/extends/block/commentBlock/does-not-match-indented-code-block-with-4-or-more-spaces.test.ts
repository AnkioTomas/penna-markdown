import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("does not match indented code block with 4 or more spaces", () => {
  const engine = () => createEngine();
  const md = "1\n\n    %%%\n    hidden\n    %%%";
  const html = renderMarkdown(createEngine(), md);
  expect(html).toBe("<p>1</p>\n<pre><code>%%%\nhidden\n%%%\n</code></pre>\n");
});
