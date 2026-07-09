import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 40: ATX heading not interrupting paragraph due to indentation", () => {
  const input = "foo\n    # bar";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<p>foo\n# bar</p>\n");
});
