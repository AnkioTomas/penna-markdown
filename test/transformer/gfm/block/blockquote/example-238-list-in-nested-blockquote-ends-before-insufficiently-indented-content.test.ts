import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 238: list in nested blockquote ends before insufficiently indented content", () => {
  const html = renderMarkdown(createEngine(), ">>- one\n>>\n  >  > two\n");
  expect(html).toBe(
    "<blockquote>\n<blockquote>\n<ul>\n<li>one</li>\n</ul>\n<p>two</p>\n</blockquote>\n</blockquote>\n",
  );
});
