import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 284: Ordered list with start != 1 cannot interrupt paragraph", () => {
  const md =
    "The number of windows in my house is\n14.  The number of doors is 6.\n";
  const html = renderMarkdown(createEngine(), md);
  expect(html).toBe(
    "<p>The number of windows in my house is\n14.  The number of doors is 6.</p>\n",
  );
});
