import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 46: backslash-escaped # do not count as closing sequence", () => {
  const html = renderMarkdown(
    createEngine(),
    "### foo \\###\n## foo #\\##\n# foo \\#\n",
  );
  expect(html).toBe("<h3>foo ###</h3>\n<h2>foo ###</h2>\n<h1>foo #</h1>\n");
});
