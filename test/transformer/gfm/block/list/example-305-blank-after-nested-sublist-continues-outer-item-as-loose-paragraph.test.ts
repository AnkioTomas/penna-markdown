import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 305: Blank after nested sublist continues outer item as loose paragraph", () => {
  const html = renderMarkdown(createEngine(), "* foo\n  * bar\n\n  baz\n");
  expect(html).toBe(
    "<ul>\n<li>\n<p>foo</p>\n<ul>\n<li>bar</li>\n</ul>\n<p>baz</p>\n</li>\n</ul>\n",
  );
});
