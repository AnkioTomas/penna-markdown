import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("requires space after opening !!", () => {
  const html = renderMarkdown(createEngine(), "!!剧透内容 !!\n");
  expect(html).toBe('<p><span class="cherry-spoiler">剧透内容 </span></p>\n');
});
