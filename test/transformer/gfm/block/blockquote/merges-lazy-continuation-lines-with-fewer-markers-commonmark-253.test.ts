import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("merges lazy continuation lines with fewer markers (CommonMark #253)", () => {
  const html = renderMarkdown(createEngine(), ">>> foo\n> bar\n>>baz\n");
  expect(html).toBe(
    "<blockquote>\n<blockquote>\n<blockquote>\n<p>foo\nbar\nbaz</p>\n</blockquote>\n</blockquote>\n</blockquote>\n",
  );
});
