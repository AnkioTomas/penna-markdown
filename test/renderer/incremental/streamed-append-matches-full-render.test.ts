/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { createJsdomRenderer as createRenderer } from "../helpers";
import { stripHashAttr } from "@/renderer/incremental/BlockIndex";

const DOC = [
  "# 流式标题",
  "",
  "第一段正文，含 `inline code` 与 **强调**。",
  "",
  "- 列表项 A",
  "- 列表项 B",
  "",
  "```ts",
  'const x: number = 1;\nconsole.log("stream");',
  "```",
  "",
  "> [!NOTE]",
  "> 提示块。",
  "",
  "| 列 A | 列 B |",
  "| ---- | ---- |",
  "| 1    | 2    |",
  "",
  "结尾段落。",
  "",
].join("\n");

/**
 * 逐 chunk `append` 得到的 DOM 必须与整篇 `renderFull` 一致。
 *
 * chunk 边界会落在空行、围栏内部、表格中间等任意位置，
 * 任何一处把原始换行还原错，块结构就会和全量渲染分叉。
 */
it("streamed append yields the same DOM as a full render", () => {
  const { renderer, mount } = createRenderer();

  for (let cursor = 0; cursor < DOC.length;) {
    const step = (cursor % 7) + 1;
    const next = Math.min(DOC.length, cursor + step);
    renderer.append(DOC.slice(cursor, next));
    cursor = next;
  }

  const streamed = stripHashAttr(mount.innerHTML);
  renderer.destroy();

  const full = createRenderer();
  full.renderer.renderFull(DOC);
  const expected = stripHashAttr(full.mount.innerHTML);
  full.renderer.destroy();

  expect(streamed).toBe(expected);
});
