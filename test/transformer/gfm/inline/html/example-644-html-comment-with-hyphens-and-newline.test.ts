import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 644: HTML comment with hyphens and newline", () => {
  const transformer = createEngine();
  const markdown = "foo <!-- this is a --\ncomment - with hyphens -->\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe(
    "<p>foo <!-- this is a --\ncomment - with hyphens --></p>\n",
  );
});
