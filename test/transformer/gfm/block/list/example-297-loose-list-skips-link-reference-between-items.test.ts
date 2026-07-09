import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 297: Loose list skips link reference between items", () => {
  const md = "- a\n- b\n\n  [ref]: /url\n- d\n";
  const html = renderMarkdown(createEngine(), md);
  expect(html).toBe(
    "<ul>\n<li>\n<p>a</p>\n</li>\n<li>\n<p>b</p>\n</li>\n<li>\n<p>d</p>\n</li>\n</ul>\n",
  );
});
