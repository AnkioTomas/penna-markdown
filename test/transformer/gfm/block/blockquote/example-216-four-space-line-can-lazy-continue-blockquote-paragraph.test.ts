import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 216: four-space line can lazy continue blockquote paragraph", () => {
  const html = renderMarkdown(createEngine(), "> foo\n    - bar\n");
  expect(html).toBe("<blockquote>\n<p>foo\n- bar</p>\n</blockquote>\n");
});
