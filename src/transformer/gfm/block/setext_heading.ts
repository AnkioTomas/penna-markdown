/**
 * @file 块级语法：Setext 标题 (===, ---)
 * @module transformer/gfm/block/setextHeading
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import {isBlankString} from "@/transformer/utils/normalize";

// 提取下划线的工具函数
export function getSetextUnderlineInfo(line: string): { level: number } | null {
  let i = 0; let spaceCount = 0;
  while (i < line.length && line[i] === ' ' && spaceCount < 3) { spaceCount++; i++; }
  if (i >= line.length) return null;

  const char = line[i];
  if (char !== '=' && char !== '-') return null;

  const level = char === '=' ? 1 : 2;
  while (i < line.length && line[i] === char) i++;
  while (i < line.length && (line[i] === ' ' || line[i] === '\t')) i++;

  return i < line.length ? null : { level };
}

class SetextHeadingBlockParser extends BaseBlockParser {
  // 优先级必须高于 Paragraph
  constructor() { super("setext_heading", 100); }

  /** @inheritdoc */
  canOpenAt(lines: string[], index: number, ctx: BlockParseContext): boolean {
    // 1. 如果当前行本身就是空行或下划线，直接 pass (下划线不能没有前置文本)
    if (isBlankString(lines[index])) return false;
    if (getSetextUnderlineInfo(lines[index])) return false;

    // 2. 抛出预读探针，往下扫！
    let i = index + 1;
    while (i < lines.length) {
      const line = lines[i];

      // 遇到空行，说明文本断了，没有下划线
      if (isBlankString(line)) return false;

      // 命中目标！这确实是个 Setext 标题
      if (getSetextUnderlineInfo(line)) return true;

      i++;
    }
    return false;
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    let i = index;
    let length = 0;
    const contentLines: string[] = [];

    // 这里的逻辑和 canOpenAt 一模一样，只不过这次是真的吃掉它们
    while (i < lines.length) {
      const line = lines[i];
      const underline = getSetextUnderlineInfo(line);

      if (underline) {
        // 吃掉下划线，结账！
        length += line.length;
        const content = contentLines.join("\n");

        const node = createNode("setext_heading", length, undefined, ctx.parseInline(content), {
          level: underline.level
        });

        return { node, nextIndex: i + 1 };
      }

      // 吃掉文本
      contentLines.push(line);
      length += line.length;
      i++;
    }

    return null;
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: any) {
    const level = node.props?.level || 1;
    return `<h${level}>${ctx.renderInline(node.children)}</h${level}>`;
  }
}

export default new SetextHeadingBlockParser();