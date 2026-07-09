import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("paragraph interrupted by blockquote (CommonMark #247)", () => {
  expect(renderMarkdown(createEngine(), "foo\n> bar\n")).toBe(
    "<p>foo</p>\n<blockquote>\n<p>bar</p>\n</blockquote>\n",
  );
});
