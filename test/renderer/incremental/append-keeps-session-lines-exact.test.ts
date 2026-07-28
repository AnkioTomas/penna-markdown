/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { normalizeMarkdownLines } from "@/transformer/utils/markdownLines.js";
import { createJsdomRenderer as createRenderer } from "../helpers";

/**
 * `append` 不再重切整篇文档，而是在已有行数组尾部拼接。
 * 一旦拼错，脏区行号就会错位，增量解析会挂到错误的块上。
 */
function streamAndCheck(doc: string, step: number): void {
  const { renderer } = createRenderer();
  const session = renderer["session"];

  let acc = "";
  for (let i = 0; i < doc.length; i += step) {
    const chunk = doc.slice(i, i + step);
    acc += chunk;
    renderer.append(chunk);
    expect(session.lines).toEqual(normalizeMarkdownLines(acc));
  }

  renderer.destroy();
}

const DOC = [
  "# 标题",
  "",
  "段落一，继续写。",
  "",
  "```js",
  "const a = 1;",
  "```",
  "",
  "- 列表 A",
  "- 列表 B",
  "",
  "> 引用",
  "",
  "末尾段落",
  "",
].join("\n");

it("append keeps session lines identical to a full split", () => {
  for (const step of [1, 3, 7, 40]) streamAndCheck(DOC, step);
});

it("append keeps session lines exact for CRLF documents", () => {
  const crlf = DOC.replace(/\n/g, "\r\n");
  for (const step of [1, 2, 5]) streamAndCheck(crlf, step);
});
