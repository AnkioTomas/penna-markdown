import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 290: Insufficient indent keeps items at same list level", () => {
  const input = "- a\n - b\n  - c\n   - d\n  - e\n - f\n- g\n";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe(
    "<ul>\n<li>a</li>\n<li>b</li>\n<li>c</li>\n<li>d</li>\n<li>e</li>\n<li>f</li>\n<li>g</li>\n</ul>\n",
  );
});
