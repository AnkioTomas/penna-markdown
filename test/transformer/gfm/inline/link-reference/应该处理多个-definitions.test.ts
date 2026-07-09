import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Link Reference Definitions 测试
 */

const gfmCases = JSON.parse(
  readFileSync(
    resolve(import.meta.dirname, "../../../../fixtures/gfm/cases.json"),
    "utf8",
  ),
);

/** @param {number} id */
function gfmCase(id) {
  const c = gfmCases.find((x) => x.id === id);
  if (!c) throw new Error(`GFM case ${id} not found`);
  return c;
}

/**
 * 用户报告的 GFM 失败用例 + 同章节关联用例
 * @type {{ id: number, name: string }[]}
 */
const GFM_LINK_REF_CASES = [
  { id: 163, name: "label 转义与 shortcut 文本" },
  { id: 164, name: "多行尖括号 destination 与单引号 title" },
  { id: 165, name: "多行单引号 title" },
  { id: 166, name: "title 内含空行则定义无效" },
  { id: 167, name: "destination 可换行续写" },
  { id: 170, name: "<dest>(title) 无空白分隔 — 非合法定义" },
  { id: 171, name: "destination/title 反斜杠转义与 href 编码" },
  { id: 173, name: "重复定义 first wins" },
  { id: 175, name: "Unicode label 匹配与 href percent-encode" },
  { id: 177, name: "label 含换行 — 消费行但不注册定义" },
  { id: 178, name: "title 后有多余字符 — 整段非定义" },
  { id: 179, name: "单行完整定义后，续行不构成 title" },
  { id: 182, name: "定义不能打断段落" },
  { id: 183, name: "heading 后定义不吸收 blockquote" },
  { id: 184, name: "完整定义不吸收 setext heading 文本" },
  { id: 185, name: "完整定义不将 === 当作 title 续行" },
  { id: 186, name: "连续定义与多行 title 后的 shortcut" },
  { id: 187, name: "blockquote 内的定义可被文档其他位置引用" },
];

let engine;

it("应该处理多个 definitions", () => {
  const engine = createEngine();
  const markdown = `[link1]: https://example.com
[link2]: https://example.org "Title"

[a][link1]

[b][link2]`;

  const html = renderMarkdown(engine, markdown);
  expect(html).toContain('href="https://example.com"');
  expect(html).toContain(">a</a>");
  expect(html).toContain('href="https://example.org"');
  expect(html).toContain(">b</a>");
  expect(html).toContain('title="Title"');
});
