import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 357: unclosed backtick string stays literal", () => {
  const html = renderMarkdown(createEngine(), "```foo``\n");
  expect(html).toBe("<p>```foo``</p>\n");
});
