import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 346: code span with trailing space", () => {
  const input = "``\nfoo \n``";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<p><code>foo </code></p>\n");
});
