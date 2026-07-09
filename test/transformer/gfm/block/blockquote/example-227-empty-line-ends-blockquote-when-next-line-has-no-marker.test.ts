import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 227: empty > line ends blockquote when next line has no marker", () => {
  const html = renderMarkdown(createEngine(), "> bar\n>\nbaz\n");
  expect(html).toBe("<blockquote>\n<p>bar</p>\n</blockquote>\n<p>baz</p>\n");
});
