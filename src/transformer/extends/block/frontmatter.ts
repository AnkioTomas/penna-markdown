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
 * 解析结果写入 store.frontMatter，并生成 invisible AST 节点供增量合并。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { parse as parseYaml } from "yaml";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext";

/** 判断是否为 frontmatter 围栏行。 */
export function isFrontmatterFenceLine(line: string): boolean {
  const s = (line ?? "").trimEnd();
  if (s.length < 3) return false;
  if (s[0] !== "-" || s[1] !== "-" || s[2] !== "-") return false;
  const next = s[3];
  return next === undefined || next === " " || next === "\t";
}

/** 文档含 frontmatter 时返回其结束行（0-based 不含），否则 0。 */
export function frontmatterEndLine(lines: string[]): number {
  if (!isFrontmatterFenceLine(lines[0] ?? "")) return 0;
  for (let i = 1; i < lines.length; i++) {
    if (isFrontmatterFenceLine(lines[i] ?? "")) return i + 1;
  }
  return 0;
}

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

class FrontmatterBlockParser extends BaseBlockParser {
  constructor() {
    super("frontmatter", true);
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    if (index !== 0) return false;
    return isFrontmatterFenceLine(lines[0] ?? "");
  }

  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const contentLines: string[] = [];
    let i = 1;

    while (i < lines.length) {
      if (isFrontmatterFenceLine(lines[i] ?? "")) {
        const data = parseFrontmatterYaml(contentLines.join("\n"));
        if (Object.keys(data).length === 0) return null;

        ctx.store.set("frontMatter", data);
        const lineCount = i + 1 - index;
        return {
          nextIndex: i + 1,
          node: createNode("frontmatter", lineCount, undefined, undefined, {
            invisible: true,
            anchorSourceLine: true,
            sourceStartLine: 0,
            parserStore: { frontMatter: data },
          }),
        };
      }
      contentLines.push(lines[i] ?? "");
      i += 1;
    }

    return null;
  }

  render() {
    return "";
  }
}

export default new FrontmatterBlockParser();
