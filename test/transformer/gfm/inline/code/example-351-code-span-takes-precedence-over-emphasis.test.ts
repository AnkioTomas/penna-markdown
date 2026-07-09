import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 351: code span takes precedence over emphasis", () => {
  const html = renderMarkdown(createEngine(), "*foo`*`\n");
  expect(html).toBe("<p>*foo<code>*</code></p>\n");
});
