import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 260: Empty item with spaces after marker", () => {
  const html = renderMarkdown(createEngine(), "- foo\n-   \n- bar\n");
  expect(html).toBe("<ul>\n<li>foo</li>\n<li></li>\n<li>bar</li>\n</ul>\n");
});
