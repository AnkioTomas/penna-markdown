/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { createJsdomRenderer as createRenderer } from "../helpers";

/**
 * 全量降级（full-replace / global-effect）不再 replaceChildren 整片重建：
 * renderFull 经 reconcileDomFull 按渲染内容复用未变块 DOM，仅替换变化块。
 */
it("full render reuses unchanged block DOM and only replaces the changed block", () => {
  const { renderer, mount } = createRenderer();

  renderer.renderFull("Before\n\n!iframe[Demo](https://example.com)\n\nAfter");

  const iframe = mount.querySelector("iframe");
  expect(iframe).toBeTruthy();

  const firstBefore = mount.querySelector("p")!;
  expect(firstBefore.textContent).toContain("Before");

  const paragraphsBefore = [...mount.querySelectorAll("p")];
  const lastBefore = paragraphsBefore[paragraphsBefore.length - 1]!;
  expect(lastBefore.textContent).toContain("After");

  // 第二次全量渲染（等价降级路径），仅末段内容变化。
  renderer.renderFull(
    "Before\n\n!iframe[Demo](https://example.com)\n\nAfter edited",
  );

  // 未变块：iframe 与首段仍是同一 DOM 节点（复用，未重建、未重载媒体）。
  expect(mount.querySelector("iframe")).toBe(iframe);
  expect(mount.querySelector("p")).toBe(firstBefore);

  // 变化块：末段被替换为新节点，且内容已更新。
  const paragraphsAfter = [...mount.querySelectorAll("p")];
  const lastAfter = paragraphsAfter[paragraphsAfter.length - 1]!;
  expect(lastAfter).not.toBe(lastBefore);
  expect(lastAfter.textContent).toContain("After edited");

  renderer.destroy();
});
