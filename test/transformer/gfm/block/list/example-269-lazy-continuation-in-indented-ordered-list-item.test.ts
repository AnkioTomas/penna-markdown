import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 269: Lazy continuation in indented ordered list item", () => {
  const html = renderMarkdown(
    createEngine(),
    "  1.  A paragraph\n    with two lines.\n",
  );
  expect(html).toBe("<ol>\n<li>A paragraph\nwith two lines.</li>\n</ol>\n");
});
