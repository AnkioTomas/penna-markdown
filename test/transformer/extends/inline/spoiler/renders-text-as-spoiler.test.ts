import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders !! text !! as spoiler", () => {
  const html = renderMarkdown(createEngine(), "这是 !! 剧透内容 !! 正常文字\n");
  expect(html).toBe(
    '<p>这是 <span class="penna-spoiler"> 剧透内容 </span> 正常文字</p>\n',
  );
});
