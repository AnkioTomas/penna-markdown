/**
 * 行内语法：斜体 *text* 或 _text_
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { isEscaped, trySkipInlineLink, trySkipReferenceLink } from "@/transformer/gfm/inline/shared.js";

class EmphasisInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "emphasis", priority: 30 });
  }

  parse(src, index, ctx) {
    if (isEscaped(src, index)) return null;

    let delimiter = "";
    if (src[index] === "*") {
      if (src[index + 1] === "*") return null;
      delimiter = "*";
    } else if (src[index] === "_") {
      if (src[index + 1] === "_") return null;
      const prevChar = index > 0 ? src[index - 1] : "";
      if (/[\p{L}\p{N}]/u.test(prevChar)) return null;
      delimiter = "_";
    } else {
      return null;
    }

    if (!this._canOpen(src, index, delimiter)) return null;

    let i = index + 1;
    let stack = 1;
    const innerStart = i;

    while (i < src.length) {
      if (isEscaped(src, i)) {
        i++;
        continue;
      }

      if (src[i] === "[") {
        const linkEnd = trySkipInlineLink(src, i);
        if (linkEnd > i) {
          i = linkEnd;
          continue;
        }
        const refEnd = trySkipReferenceLink(src, i);
        if (refEnd > i) {
          i = refEnd;
          continue;
        }
      }

      if (src[i] === delimiter) {
        let count = 0;
        let j = i;
        while (j < src.length && src[j] === delimiter) {
           count++;
           j++;
        }

        if (this._canClose(src, i, delimiter)) {
          stack--;
          if (stack === 0) {
            const inner = src.slice(innerStart, i);
            if (inner.length === 0) return null;
            return {
              node: createNode(this.type, { children: ctx.parseInline(inner) }),
              nextIndex: i + 1,
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
    const nextChar = src[i + 1];
    if (!nextChar || /\s/.test(nextChar)) return false;
    return true;
  }

  _canClose(src, i, delimiter) {
    if (delimiter === "_") {
      const nextChar = i + 1 < src.length ? src[i + 1] : "";
      if (/[\p{L}\p{N}]/u.test(nextChar)) return false;
    }
    const prevChar = src[i - 1];
    if (!prevChar || /\s/.test(prevChar)) return false;
    return true;
  }

  render(node, ctx) {
    return `<em>${ctx.renderInline(node.children)}</em>`;
  }
}

export default new EmphasisInlineParser();
