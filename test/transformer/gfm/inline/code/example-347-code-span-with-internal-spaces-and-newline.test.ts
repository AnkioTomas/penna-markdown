import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 347: code span with internal spaces and newline", () => {
  const input = "`foo   bar \nbaz`";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<p><code>foo   bar  baz</code></p>\n");
});
