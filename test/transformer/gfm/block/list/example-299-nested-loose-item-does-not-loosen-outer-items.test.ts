import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 299: Nested loose item does not loosen outer items", () => {
  const html = renderMarkdown(createEngine(), "- a\n  - b\n\n    c\n- d\n");
  expect(html).toBe(
    "<ul>\n<li>a\n<ul>\n<li>\n<p>b</p>\n<p>c</p>\n</li>\n</ul>\n</li>\n<li>d</li>\n</ul>\n",
  );
});
