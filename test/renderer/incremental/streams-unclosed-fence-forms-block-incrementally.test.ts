/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { createJsdomRenderer as createRenderer } from "../helpers";
import { normalizeMarkdownLines } from "@/transformer/utils/markdownLines.js";

function stubLocalStorage(): void {
  const store: Record<string, string> = {};
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key];
    },
    key: () => null,
    length: 0,
  });
}

const DOC = [
  "before",
  "",
  "::: steps",
  "",
  "1. Step one",
  "",
  "body one",
  "",
  "2. Step two",
  "",
  "body two",
  "",
  ":::",
  "",
  "after",
].join("\n");

/**
 * 逐字符流式喂入，模拟 AI 增量输出：每步追加固定字符，
 * 用与流式 demo 一致的“尾部追加”行变更集走增量路径。
 */
it("streams an unclosed fence and forms the block incrementally", () => {
  stubLocalStorage();
  const { renderer, mount } = createRenderer();

  let cursor = 0;
  const STEP = 5;
  while (cursor < DOC.length) {
    const oldPrefix = DOC.slice(0, cursor);
    const next = Math.min(DOC.length, cursor + STEP);
    const newPrefix = DOC.slice(0, next);

    const oldCount = normalizeMarkdownLines(oldPrefix).length;
    const newCount = normalizeMarkdownLines(newPrefix).length;

    if (oldCount === 0) {
      renderer.render(newPrefix);
    } else {
      renderer.render(newPrefix, [
        {
          fromA: oldCount,
          toA: oldCount,
          fromB: oldCount,
          toB: newCount,
          deletedLines: 0,
          insertedLines: Math.max(0, newCount - oldCount),
        },
      ]);
    }
    cursor = next;
  }

  const steps = mount.querySelectorAll(".penna-steps");
  expect(steps.length).toBe(1);
  expect(mount.querySelectorAll(".penna-steps > ol > li").length).toBe(2);

  // 增量最终态应与全量渲染一致（data-hash 含每次 render 的随机实例后缀，剔除后比对）
  const stripHash = (html: string) => html.replace(/ data-hash="[^"]*"/g, "");
  const { renderer: full, mount: fullMount } = createRenderer();
  full.render(DOC);
  expect(stripHash(mount.innerHTML)).toBe(stripHash(fullMount.innerHTML));

  renderer.destroy();
  full.destroy();
  document.body.innerHTML = "";
});
