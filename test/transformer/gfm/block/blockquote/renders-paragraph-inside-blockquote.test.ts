import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders paragraph inside blockquote", () => {
  const html = renderMarkdown(createEngine(), "> foo\n");
  expect(html).toBe("<blockquote>\n<p>foo</p>\n</blockquote>\n");
});
