import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 281: Different bullet starts a new list", () => {
  const input = "- foo\n- bar\n+ baz\n";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe(
    "<ul>\n<li>foo</li>\n<li>bar</li>\n</ul>\n<ul>\n<li>baz</li>\n</ul>\n",
  );
});
