/**
 * 行内语法：加粗 **text** 或 __text__
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";

class StrongInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "strong", priority: 40 });
  }

  parse(src, index, parseInline) {
    if (isEscaped(src, index)) return null;

    let delimiter = "";
    if (src.startsWith("**", index)) {
      delimiter = "**";
    } else if (src.startsWith("__", index)) {
      const prevChar = index > 0 ? src[index - 1] : "";
      if (/[\p{L}\p{N}]/u.test(prevChar)) return null;
      delimiter = "__";
    } else {
      return null;
    }

    if (!this._canOpen(src, index, delimiter)) return null;

    const delimLen = delimiter.length;
    let i = index + delimLen;
    let stack = 1;
    const innerStart = i;

    while (i <= src.length - delimLen) {
      if (isEscaped(src, i)) {
        i++;
        continue;
      }

      if (src.startsWith(delimiter, i)) {
        // 关键改进：检查这一组定界符
        let count = 0;
        let j = i;
        while (j < src.length && src[j] === delimiter[0]) {
          count++;
          j++;
        }

        if (this._canClose(src, i, delimiter)) {
          stack--;
          if (stack === 0) {
            const inner = src.slice(innerStart, i);
            if (inner.length === 0) return null;
            return {
              node: createNode(this.type, { children: parseInline(inner) }),
              nextIndex: i + delimLen,
            };
          }
          i += count;
        } else if (this._canOpen(src, i, delimiter)) {
          stack++;
          i += count;
        } else {
          i++;
        }
      } else {
        i++;
      }
    }
    return null;
  }

  _canOpen(src, i, delimiter) {
    const nextChar = src[i + delimiter.length];
    if (!nextChar || /\s/.test(nextChar)) return false;
    return true;
  }

  _canClose(src, i, delimiter) {
    if (delimiter === "__") {
      const nextChar = i + delimiter.length < src.length ? src[i + delimiter.length] : "";
      if (/[\p{L}\p{N}]/u.test(nextChar)) return false;
    }
    const prevChar = src[i - 1];
    if (!prevChar || /\s/.test(prevChar)) return false;
    return true;
  }

  render(node, renderInline) {
    return `<strong>${renderInline(node.children)}</strong>`;
  }
}

export default new StrongInlineParser();
