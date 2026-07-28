/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { createJsdomRenderer as createRenderer } from "../helpers";

/**
 * append 以原始 markdown 为基准拼接 delta。
 *
 * 若用 `session.lines.join("\n")` 还原文档，末尾空行会被 normalize pop 掉，
 * 「段落 + 空行」后再追加的 chunk 会被并进上一段，流式输出块数错乱。
 */
it("append keeps the blank line separating streamed chunks", () => {
  const { renderer, mount } = createRenderer();

  renderer.append("Hello\n\n");
  renderer.append("World");

  expect(mount.children.length).toBe(2);
  expect(mount.children[0]!.textContent).toBe("Hello");
  expect(mount.children[1]!.textContent).toBe("World");

  renderer.destroy();
});

/** 反向边界：文档不以换行结尾时，chunk 必须续在同一行内 */
it("append continues the current line when markdown has no trailing newline", () => {
  const { renderer, mount } = createRenderer();

  renderer.append("Hello");
  renderer.append(" World");

  expect(mount.children.length).toBe(1);
  expect(mount.children[0]!.textContent).toBe("Hello World");

  renderer.destroy();
});

/** append 与 render 共用同一份原始文本：render 后继续 append 不丢空行 */
it("append after render uses the rendered markdown as base", () => {
  const { renderer, mount } = createRenderer();

  renderer.render("# Title\n\n");
  renderer.append("Body");

  expect(mount.children.length).toBe(2);
  expect(mount.children[0]!.tagName).toBe("H1");
  expect(mount.children[1]!.textContent).toBe("Body");

  renderer.destroy();
});
