/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { createJsdomRenderer as createRenderer } from "../helpers";

/**
 * hash 变了不代表渲染结果变了。
 *
 * finalizer 生成的 footnotes 块没有 `props.id`，DOM 上也就没有 `data-hash`，
 * 永远命中不了 hash 复用；脏区一并重解析的邻块同理会拿到新 hash。
 * 若只按 hash 判定，这些块每次 append 都被重建——块里的 img/iframe/video
 * 会被浏览器重新请求并解码，流式输出时内存直线上涨。
 */
it("reuses DOM for a reparsed block whose rendering is unchanged", () => {
  const { renderer, mount } = createRenderer();

  renderer.render("正文[^a]\n\n[^a]: 脚注内容\n");

  const footnotes = mount.querySelector(".penna-footnotes");
  expect(footnotes).toBeTruthy();

  renderer.append("\n\n追加一段。");

  expect(mount.querySelector(".penna-footnotes")).toBe(footnotes);

  renderer.destroy();
});

/** 媒体块落在重解析区内但内容未变时，同一个 iframe 元素必须留在 DOM 上 */
it("keeps the iframe element when the tail keeps growing", () => {
  const { renderer, mount } = createRenderer();

  renderer.render("!iframe[Demo](https://example.com)\n\n尾段");

  const iframe = mount.querySelector("iframe");
  expect(iframe).toBeTruthy();

  for (const chunk of ["继", "续", "输", "出", "\n\n新段落"]) {
    renderer.append(chunk);
  }

  expect(mount.querySelector("iframe")).toBe(iframe);

  renderer.destroy();
});
