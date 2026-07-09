import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 291: Indented ordered items with blank lines form one loose list", () => {
  const input = "1. a\n\n  2. b\n\n   3. c\n";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe(
    "<ol>\n<li>\n<p>a</p>\n</li>\n<li>\n<p>b</p>\n</li>\n<li>\n<p>c</p>\n</li>\n</ol>\n",
  );
});
