import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 533: code span in link text prevents link", () => {
  const transformer = createEngine();
  const markdown = "[foo`](/uri)`\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe("<p>[foo<code>](/uri)</code></p>\n");
});
