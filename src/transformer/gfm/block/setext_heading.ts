/**
 * @file 块级语法：Setext 标题 (===, ---)
 * @module transformer/gfm/block/setextHeading
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import { skipBlockPrefixSpaces } from "@/transformer/utils/blockPrefix.js";
import { isBlankString } from "@/transformer/utils/normalize";

export function getSetextUnderlineInfo(line: string): number  {
  let i = skipBlockPrefixSpaces(line);
  if (i >= line.length) return -1;

  const char = line[i];
  if (char !== '=' && char !== '-') return -1;
  const level = char === '=' ? 1 : 2;
  while (i < line.length && line[i] === char) i += 1;
  while (i < line.length && (line[i] === ' ' || line[i] === '\t')) i += 1;

  return i < line.length ? -1 : level;
}

class SetextHeadingBlockParser extends BaseBlockParser {
  // 优先级必须高于 Paragraph
  constructor() { super("setext_heading"); }

  /** @inheritdoc */
  canOpenAt(lines: string[], index: number, ctx: BlockParseContext): boolean {
    let line = lines[index];
    if (isBlankString(line)) return false;
    if (ctx.inContainer(lines, index)) return false;

    // 2. 抛出预读探针，往下扫！
    let i = index + 1;
    while (i < lines.length) {
      const line = lines[i];

      // 遇到空行，说明文本断了，没有下划线
      if (isBlankString(line)) return false;

      // 命中目标！这确实是个 Setext 标题
      if (getSetextUnderlineInfo(line) > 0) return true;

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

      if (underline > 0) {
        // 吃掉下划线，结账！
        length += line.length;
        const content = contentLines.join("\n");

        const node = createNode("setext_heading", length, undefined, ctx.parseInline(content), {
          level: underline
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
    return `<h${level}>${ctx.renderInline(node.children).trim()}</h${level}>`;
  }
}

export default new SetextHeadingBlockParser();