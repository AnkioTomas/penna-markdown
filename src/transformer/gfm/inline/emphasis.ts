/**
 * @file 行内语法：斜体
 * @module transformer/gfm/inline/emphasis
 *
 * 斜体 *text* / _text_。
 * 预读扫描时通过 ctx.parseInlineAt(..., true) 跳过 code span 等强打断结构。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { isDelimiterWhitespace } from "@/transformer/utils/normalize.js";
import { canOpenDelimiter } from "@/transformer/utils/flanking.js";
import { InlineParseContext } from "@/transformer/core/context/InlineParseContext";

const isAlphanumeric = (char: string) => /[A-Za-z0-9]/.test(char);

class EmphasisInlineParser extends BaseInlineParser {
  constructor() {
    super("emphasis", false);
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext) {
    const marker = src[index];
    if (marker !== "*" && marker !== "_") return null;
    if (src[index + 1] === marker) return null;

    const nextChar = src[index + 1] || "";
    if (isDelimiterWhitespace(nextChar)) return null;

    if (!canOpenDelimiter(src, index, 1, marker)) return null;
    if (marker === "_") {
      const prevChar = index > 0 ? src[index - 1] : "";
      if (isAlphanumeric(prevChar)) return null;
    }

    const stack: number[] = [];
    let j = index + 1;
    let foundCloser = false;
    let closerIndex = -1;

    while (j < src.length) {
      if (src[j] === "\\" && j + 1 < src.length) {
        j += 2;
        continue;
      }

      const skipped = ctx.parseInlineAt(src, j, true);
      if (skipped) {
        j = skipped.nextIndex;
        continue;
      }

      if (src[j] === marker && src[j + 1] === marker) {
        j += 2;
        continue;
      }

      if (src[j] === marker) {
        const prevChar = src[j - 1] || "";
        const charAfter = src[j + 1] || "";

        let isValidCloser = !isDelimiterWhitespace(prevChar);
        let isValidOpener = !isDelimiterWhitespace(charAfter);

        if (marker === "_") {
          if (isValidCloser && isAlphanumeric(charAfter)) isValidCloser = false;
          if (isValidOpener && isAlphanumeric(prevChar)) isValidOpener = false;
        }

        if (isValidCloser) {
          if (stack.length > 0) {
            stack.pop();
            j++;
            continue;
          }
          foundCloser = true;
          closerIndex = j;
          break;
        }
        if (isValidOpener) {
          stack.push(j);
        }
      }
      j++;
    }

    if (!foundCloser) return null;

    const innerText = src.slice(index + 1, closerIndex);
    const children = ctx.parseInline(innerText);
    const totalLength = closerIndex + 1 - index;

    return {
      node: createNode(this.type, totalLength, undefined, children),
      nextIndex: index + totalLength,
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: { renderInline(nodes?: MarkdownNode[]): string }) {
    return `<em>${ctx.renderInline(node.children)}</em>`;
  }
}

export default new EmphasisInlineParser();
