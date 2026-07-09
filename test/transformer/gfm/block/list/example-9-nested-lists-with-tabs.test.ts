import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 9: Nested lists with tabs", () => {
  const input = " - foo\n   - bar\n\t - baz";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toContain("<ul>");
  expect(html).toContain("<li>foo\n<ul>");
  expect(html).toContain("<li>bar\n<ul>");
  expect(html).toContain("<li>baz</li>");
});
