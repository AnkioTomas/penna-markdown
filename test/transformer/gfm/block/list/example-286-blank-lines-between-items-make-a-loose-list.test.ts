import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 286: Blank lines between items make a loose list", () => {
  const input = "- foo\n\n- bar\n\n\n- baz\n";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe(
    "<ul>\n<li>\n<p>foo</p>\n</li>\n<li>\n<p>bar</p>\n</li>\n<li>\n<p>baz</p>\n</li>\n</ul>\n",
  );
});
