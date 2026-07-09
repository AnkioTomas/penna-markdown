import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 275: Three spaces is not enough to nest under wide ordered marker", () => {
  const html = renderMarkdown(createEngine(), "10) foo\n   - bar\n");
  expect(html).toBe(
    '<ol start="10">\n<li>foo</li>\n</ol>\n<ul>\n<li>bar</li>\n</ul>\n',
  );
});
