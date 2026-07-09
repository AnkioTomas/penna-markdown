import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders fenced code block with ~~~", () => {
  const html = renderMarkdown(createEngine(), "~~~\nfoo\n~~~");
  expect(html).toBe("<pre><code>foo\n</code></pre>\n");
});
