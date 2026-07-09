import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 30: Thematic break takes precedence over list item", () => {
  const input = "* Foo\n* * *\n* Bar\n";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe(
    "<ul>\n<li>Foo</li>\n</ul>\n<hr />\n<ul>\n<li>Bar</li>\n</ul>\n",
  );
});
