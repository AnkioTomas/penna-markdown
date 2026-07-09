import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("blank marker line splits paragraphs (CommonMark #246)", () => {
  expect(renderMarkdown(createEngine(), "> foo\n>\n> bar\n")).toBe(
    "<blockquote>\n<p>foo</p>\n<p>bar</p>\n</blockquote>\n",
  );
});
