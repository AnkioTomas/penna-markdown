import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 4: List item with tab continuation", () => {
  const input = "  - foo\n\n\tbar";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toContain("<ul>");
  expect(html).toContain("<li>");
  expect(html).toContain("<p>foo</p>");
  expect(html).toContain("<p>bar</p>");
});
