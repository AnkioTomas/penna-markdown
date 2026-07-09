import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 359: shorter close allows inner code span", () => {
  const html = renderMarkdown(createEngine(), "`foo``bar``\n");
  expect(html).toBe("<p>`foo<code>bar</code></p>\n");
});
