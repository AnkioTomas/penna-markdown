import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 278: List item with heading and setext continuation", () => {
  const html = renderMarkdown(createEngine(), "- # Foo\n- Bar\n  ---\n  baz\n");
  expect(html).toBe(
    "<ul>\n<li>\n<h1>Foo</h1>\n</li>\n<li>\n<h2>Bar</h2>\nbaz</li>\n</ul>\n",
  );
});
