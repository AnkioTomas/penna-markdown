import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 296: One loose item makes entire list loose", () => {
  const html = renderMarkdown(createEngine(), "- a\n- b\n\n  c\n- d\n");
  expect(html).toBe(
    "<ul>\n<li>\n<p>a</p>\n</li>\n<li>\n<p>b</p>\n<p>c</p>\n</li>\n<li>\n<p>d</p>\n</li>\n</ul>\n",
  );
});
