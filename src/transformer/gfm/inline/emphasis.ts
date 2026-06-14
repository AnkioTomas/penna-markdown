/**
 * @file 行内语法：斜体
 * @module transformer/gfm/inline/emphasis
 *
 * 斜体 *text* / _text_。
 * 作为兜底解析，遇到同符号双字符会自动跳过，避免误吞加粗标记。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";

const isAlphanumeric = (char: string) => /[A-Za-z0-9]/.test(char);
const isWhitespace = (char: string) => !char || char === ' ' || char === '\t' || char === '\n' || char === '\r';

class EmphasisInlineParser extends BaseInlineParser {
  constructor() {
    // 优先级 3000，在 Strong (3010) 之后执行
    super("emphasis", 3000);
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: any) {
    const marker = src[index];
    if (marker !== '*' && marker !== '_') return null;

    // 如果连续两个符号，说明这是加粗漏下来的（或者是畸形的），斜体不处理头部双符号
    if (src[index + 1] === marker) return null;

    // 1. 校验起始符有效性
    const nextChar = src[index + 1] || '';
    if (isWhitespace(nextChar)) return null;

    // GFM 规范：下划线 `_` 不能在词语内部触发
    if (marker === '_') {
      const prevChar = index > 0 ? src[index - 1] : '';
      if (isAlphanumeric(prevChar)) return null;
    }

    // 2. 堆栈预读寻找闭合符
    const stack: number[] = [];
    let j = index + 1;
    let foundCloser = false;
    let closerIndex = -1;

    while (j < src.length) {
      if (src[j] === '\\' && j + 1 < src.length) {
        j += 2;
        continue;
      }

      // 🌟 隔离逻辑：如果遇到连续两个当前 marker，直接跳过 2 个位移。
      // 因为这是潜在的 Strong 节点，不应被拆开当作单标记处理。
      if (src[j] === marker && src[j + 1] === marker) {
        j += 2;
        continue;
      }

      if (src[j] === marker) {
        const prevChar = src[j - 1] || '';
        const charAfter = src[j + 1] || '';

        let isValidCloser = !isWhitespace(prevChar);
        let isValidOpener = !isWhitespace(charAfter);

        if (marker === '_') {
          if (isValidCloser && isAlphanumeric(charAfter)) isValidCloser = false;
          if (isValidOpener && isAlphanumeric(prevChar)) isValidOpener = false;
        }

        // 🌟 堆栈匹配逻辑
        if (isValidCloser) {
          if (stack.length > 0) {
            stack.pop();
            j++;
            continue;
          } else {
            foundCloser = true;
            closerIndex = j;
            break;
          }
        } else if (isValidOpener) {
          stack.push(j);
        }
      }
      j++;
    }

    if (!foundCloser) return null;

    // 3. 提取内容递归解析，打包返回
    const innerText = src.slice(index + 1, closerIndex);
    const children = ctx.parseInline(innerText);
    const totalLength = (closerIndex + 1) - index;

    return {
      node: createNode(this.type, totalLength, undefined, children),
      nextIndex: index + totalLength
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: any) {
    return `<em>${ctx.renderInline(node.children)}</em>`;
  }
}

export default new EmphasisInlineParser();