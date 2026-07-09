import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 233: Blank before non-list content does not make list loose", () => {
  const html = renderMarkdown(createEngine(), "- one\n\n two\n");
  expect(html).toBe("<ul>\n<li>one</li>\n</ul>\n<p>two</p>\n");
});
