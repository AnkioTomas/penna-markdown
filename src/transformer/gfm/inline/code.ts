/**
 * @file 行内语法：行内代码 (Code Span)
 * @module transformer/gfm/inline/code
 *
 * 反引号包裹的行内代码：`code`、`` ` `` 等。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { InlineParseContext } from "@/transformer/core/context/InlineParseContext";

/**
 * 扫描连续反引号长度。
 *
 * @param {string} src
 * @param {number} pos
 * @returns {number}
 */
function scanBacktickRun(src: string, pos: number): number {
  let len = 0;
  while (pos + len < src.length && src[pos + len] === "`") len += 1;
  return len;
}

/**
 * 判断反引号串是否为合法 code span 定界符（前后不能紧邻反引号）。
 *
 * @param {string} src
 * @param {number} pos
 * @param {number} len
 * @returns {boolean}
 */
function isValidBacktickString(src: string, pos: number, len: number): boolean {
  if (len <= 0 || src[pos] !== "`") return false;
  const before = pos > 0 ? src[pos - 1] : "";
  const after = pos + len < src.length ? src[pos + len] : "";
  return before !== "`" && after !== "`";
}

/**
 * 行内代码解析器。
 *
 * @extends {BaseInlineParser}
 */
class InlineCodeParser extends BaseInlineParser {
  constructor() {
    super("code_span");
  }

  canOpenAt(src: string, index: number, ctx: InlineParseContext): boolean {
    return src[index] === "`";
  }

  /** @inheritdoc */
  parse(src: string, index: number) {
    if (src[index] !== "`") return null;

    const openLen = scanBacktickRun(src, index);
    if (!isValidBacktickString(src, index, openLen)) return null;

    let i = index + openLen;
    while (i < src.length) {
      if (src[i] !== "`") {
        i += 1;
        continue;
      }

      const closeLen = scanBacktickRun(src, i);
      if (closeLen === openLen && isValidBacktickString(src, i, closeLen)) {
        let content = src.slice(index + openLen, i);
        content = content.replace(/\n/g, " ");

        if (
          content.startsWith(" ") &&
          content.endsWith(" ") &&
          content.trim() !== ""
        ) {
          content = content.slice(1, -1);
        }

        const node = createNode(
          this.type,
          content.length + openLen + closeLen,
          content,
        );
        return { node, nextIndex: i + closeLen };
      }

      i += closeLen;
    }

    return null;
  }

  /** @inheritdoc */
  render(node: MarkdownNode) {
    return `<code>${escapeHtml(node.value ?? "")}</code>`;
  }
}

export default new InlineCodeParser();
