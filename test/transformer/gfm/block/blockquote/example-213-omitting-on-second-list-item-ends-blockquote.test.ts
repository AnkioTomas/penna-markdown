import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 213: omitting > on second list item ends blockquote", () => {
  const html = renderMarkdown(createEngine(), "> - foo\n- bar\n");
  expect(html).toBe(
    "<blockquote>\n<ul>\n<li>foo</li>\n</ul>\n</blockquote>\n<ul>\n<li>bar</li>\n</ul>\n",
  );
});
