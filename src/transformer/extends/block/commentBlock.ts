/**
 * @file 块级扩展语法：注释块
 * @module transformer/extends/block/commentBlock
 *
 * 语法：`%%% ... %%%`
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";

/** 块级注释开标记行：`%%%`（前导空格最多3个） */
const COMMENT_OPEN_RE = /^( {0,3})%%%(?!%)\s*(.*)$/;

function stripClosingComment(line: string): string | null {
  const match = line.match(/^(.*?)\s*%%%\s*$/);
  if (!match || !line.includes("%%%")) return null;
  return match[1];
}

class CommentBlockParser extends BaseBlockParser {
  constructor() {
    super("comment_block");
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return COMMENT_OPEN_RE.test(lines[index] ?? "");
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, _ctx: BlockParseContext) {
    const line = lines[index] ?? "";
    const open = line.match(COMMENT_OPEN_RE);
    if (!open) return null;

    const tail = open[2];
    const sameLine = stripClosingComment(tail);
    if (sameLine !== null) {
      return {
        node: createNode(this.type, 1, sameLine),
        nextIndex: index + 1,
      };
    }

    const contentLines: string[] = [];
    if (tail.trim()) contentLines.push(tail);

    let i = index + 1;
    while (i < lines.length) {
      const ln = lines[i];
      if (/^\s*%%%\s*$/.test(ln)) {
        return {
          node: createNode(this.type, i + 1 - index, contentLines.join("\n")),
          nextIndex: i + 1,
        };
      }

      const partial = stripClosingComment(ln);
      if (partial !== null) {
        if (partial) contentLines.push(partial);
        return {
          node: createNode(this.type, i + 1 - index, contentLines.join("\n")),
          nextIndex: i + 1,
        };
      }

      contentLines.push(ln);
      i += 1;
    }

    // 如果未闭合，整个剩余部分都作为注释
    return {
      node: createNode(
        this.type,
        lines.length - index,
        contentLines.join("\n"),
      ),
      nextIndex: lines.length,
    };
  }

  /** @inheritdoc */
  render(_node: MarkdownNode, _ctx: RenderContext) {
    return "";
  }
}

const commentBlockParser = new CommentBlockParser();

export default commentBlockParser;
