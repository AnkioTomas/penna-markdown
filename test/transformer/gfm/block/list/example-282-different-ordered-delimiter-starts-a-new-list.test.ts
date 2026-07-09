import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 282: Different ordered delimiter starts a new list", () => {
  const input = "1. foo\n2. bar\n3) baz\n";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe(
    '<ol>\n<li>foo</li>\n<li>bar</li>\n</ol>\n<ol start="3">\n<li>baz</li>\n</ol>\n',
  );
});
