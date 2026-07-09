import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Nested blockquotes with leading spaces (recursion test)", () => {
  const input = " > > foo";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe(
    "<blockquote>\n<blockquote>\n<p>foo</p>\n</blockquote>\n</blockquote>\n",
  );
});
