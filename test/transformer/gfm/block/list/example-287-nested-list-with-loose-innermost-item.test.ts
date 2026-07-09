import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 287: Nested list with loose innermost item", () => {
  const input = "- foo\n  - bar\n    - baz\n\n\n      bim\n";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe(
    "<ul>\n<li>foo\n<ul>\n<li>bar\n<ul>\n<li>\n<p>baz</p>\n<p>bim</p>\n</li>\n</ul>\n</li>\n</ul>\n</li>\n</ul>\n",
  );
});
