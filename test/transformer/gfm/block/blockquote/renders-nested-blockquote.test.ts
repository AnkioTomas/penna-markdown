import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders nested blockquote", () => {
  const html = renderMarkdown(createEngine(), ">> bar\n");
  expect(html).toBe(
    "<blockquote>\n<blockquote>\n<p>bar</p>\n</blockquote>\n</blockquote>\n",
  );
});
