import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 62: thematic break after blockquote is not lazy continuation", () => {
  const html = renderMarkdown(createEngine(), "> Foo\n---\n");
  expect(html).toBe("<blockquote>\n<p>Foo</p>\n</blockquote>\n<hr />\n");
});
