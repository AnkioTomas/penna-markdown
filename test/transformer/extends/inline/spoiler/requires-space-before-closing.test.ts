import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("requires space before closing !!", () => {
  const html = renderMarkdown(createEngine(), "!!内容 !!\n");
  expect(html).toBe('<p><span class="cherry-spoiler">内容 </span></p>\n');
});
