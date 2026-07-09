import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("merges lazy continuation without markers (CommonMark #252)", () => {
  const html = renderMarkdown(createEngine(), "> > > foo\nbar\n");
  expect(html).toBe(
    "<blockquote>\n<blockquote>\n<blockquote>\n<p>foo\nbar</p>\n</blockquote>\n</blockquote>\n</blockquote>\n",
  );
});
