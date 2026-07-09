import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 270: Lazy continuation in nested blockquote inside list in blockquote", () => {
  const html = renderMarkdown(
    createEngine(),
    "> 1. > Blockquote\ncontinued here.\n",
  );
  expect(html).toBe(
    "<blockquote>\n<ol>\n<li>\n<blockquote>\n<p>Blockquote\ncontinued here.</p>\n</blockquote>\n</li>\n</ol>\n</blockquote>\n",
  );
});
