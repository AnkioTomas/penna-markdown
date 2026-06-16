/**
 * @file 块级语法拓展：YAML Frontmatter
 * @module transformer/extends/block/frontmatter
 *
 * 语法示例：
 * ```
 * ---
 * title: Hello
 * ---
 * ```
 *
 * 仅匹配文档首行；解析结果写入 document.frontMatter，不产生 AST 节点。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { parse as parseYaml } from "yaml";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext";

/**
 * 判断是否为 frontmatter 围栏行。
 *
 * 规则：去除行尾空白后，必须以 `---` 开头，且 `---` 后要么结束要么跟空白字符。
 */
function isFenceLine(line: string): boolean {
  const s = (line ?? "").trimEnd();
  if (s.length < 3) return false;
  if (s[0] !== "-" || s[1] !== "-" || s[2] !== "-") return false;
  const next = s[3];
  return next === undefined || next === " " || next === "\t";
}

/**
 * 将 YAML 文本解析为 plain object。
 *
 * 空文本、解析失败或非 object 结果均返回 `{}`。
 */
function parseFrontmatterYaml(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  if (!trimmed) return {};
  try {
    const data = parseYaml(trimmed);
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

/**
 * YAML Frontmatter 块解析器。
 *
 * @extends {BaseBlockParser}
 */
class FrontmatterBlockParser extends BaseBlockParser {
  constructor() {
    super("frontmatter", true);
  }

  /** @inheritdoc */
  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    if (index !== 0) return false;
    return isFenceLine(lines[0] ?? "");
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const contentLines: string[] = [];
    let i = 1;

    while (i < lines.length) {
      if (isFenceLine(lines[i])) {
        ctx.store.set("frontMatter", parseFrontmatterYaml(contentLines.join("\n")));
        return { nextIndex: i + 1 };
      }
      contentLines.push(lines[i]);
      i += 1;
    }

    return null;
  }

  /** @inheritdoc */
  render() {
    return "";
  }
}

export default new FrontmatterBlockParser();