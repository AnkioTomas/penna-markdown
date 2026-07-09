import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 220: blank line separates block quotes", () => {
  const html = renderMarkdown(createEngine(), "> foo\n\n> bar\n");
  expect(html).toBe(
    "<blockquote>\n<p>foo</p>\n</blockquote>\n<blockquote>\n<p>bar</p>\n</blockquote>\n",
  );
});
