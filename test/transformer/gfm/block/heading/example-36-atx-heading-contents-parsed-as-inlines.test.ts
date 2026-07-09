import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 36: ATX heading contents parsed as inlines", () => {
  const html = renderMarkdown(createEngine(), "# foo *bar* \\*baz\\*\n");
  expect(html).toBe("<h1>foo <em>bar</em> *baz*</h1>\n");
});
