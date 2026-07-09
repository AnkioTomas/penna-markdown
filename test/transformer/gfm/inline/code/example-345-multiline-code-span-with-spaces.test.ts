import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 345: multiline code span with spaces", () => {
  const input = "``\nfoo\nbar  \nbaz\n``";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<p><code>foo bar   baz</code></p>\n");
});
