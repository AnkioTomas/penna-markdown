import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 295: Blank lines between items make entire list loose", () => {
  const html = renderMarkdown(createEngine(), "* a\n*\n\n* c\n");
  expect(html).toBe(
    "<ul>\n<li>\n<p>a</p>\n</li>\n<li></li>\n<li>\n<p>c</p>\n</li>\n</ul>\n",
  );
});
