/**
 * 行内语法：行内代码 (Code Span)
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";

/** @param {string} src @param {number} pos */
function scanBacktickRun(src, pos) {
  let len = 0;
  while (pos + len < src.length && src[pos + len] === "`") len += 1;
  return len;
}

/** @param {string} src @param {number} pos @param {number} len */
function isValidBacktickString(src, pos, len) {
  if (len <= 0 || src[pos] !== "`") return false;
  const before = pos > 0 ? src[pos - 1] : "";
  const after = pos + len < src.length ? src[pos + len] : "";
  return before !== "`" && after !== "`";
}

class InlineCodeParser extends BaseInlineParser {
  constructor() {
    super({ type: "code_span", priority: 100 });
  }

  parse(src, index) {
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
      if (
        closeLen === openLen &&
        isValidBacktickString(src, i, closeLen)
      ) {
        let content = src.slice(index + openLen, i);
        content = content.replace(/\n/g, " ");

        if (
          content.startsWith(" ") &&
          content.endsWith(" ") &&
          content.trim() !== ""
        ) {
          content = content.slice(1, -1);
        }

        const node = createNode(this.type, { content });
        return { node, nextIndex: i + closeLen };
      }

      i += closeLen;
    }

    const node = createNode("text", { value: src.slice(index, index + openLen) });
    return { node, nextIndex: index + openLen };
  }

  render(node) {
    return `<code>${escapeHtml(node.props.content)}</code>`;
  }
}

export default new InlineCodeParser();
