/**
 * @file 行内语法：斜体与加粗
 * @module transformer/gfm/inline/emphasis
 *
 * 斜体 *text* / _text_、加粗 **text** / __text__。
 * 纯游标向前预读，零堆栈状态，原生支持嵌套与转义。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";

// 辅助工具：判断字符性质（用于处理 _ 的词内限制规则）
const isAlphanumeric = (char: string) => /[A-Za-z0-9]/.test(char);
const isWhitespace = (char: string) => char === ' ' || char === '\t' || char === '\n' || char === '\r';

/**
 * 加粗与斜体行内解析器。
 * 融合了 Emphasis 与 Strong，不再依赖外部 finalizer。
 * @extends {BaseInlineParser}
 */
class EmphasisInlineParser extends BaseInlineParser {
  constructor() {
    // 优先级 30
    super("emphasis", 8000);
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: any) {
    const marker = src[index];
    if (marker !== '*' && marker !== '_') return null;

    // 1. 计算起始标记符的连续长度 (例如 `**` 长度为 2)
    let markerLength = 0;
    let i = index;
    while (i < src.length && src[i] === marker) {
      markerLength++;
      i++;
    }

    // 核心降维逻辑：我们每次最多只处理 2 个符号（即加粗）。
    // 如果遇到了 3 个符号 `***`，我们先吃掉 2 个变加粗，剩下的 1 个会在子节点解析时自然变成斜体！
    const targetLength = markerLength >= 2 ? 2 : 1;
    const nodeType = targetLength === 2 ? "strong" : "emphasis";

    // 2. 校验起始符 (Opener / Left-Flanking)
    const nextChar = src[index + targetLength] || '';
    if (isWhitespace(nextChar)) return null; // 后面是空格，不能作为起点

    // GFM 规范限制：下划线 `_` 不能在词语内部触发斜体（如 foo_bar_baz 不会加粗/斜体）
    if (marker === '_') {
      const prevChar = index > 0 ? src[index - 1] : '';
      if (isAlphanumeric(prevChar)) return null;
    }

    // 3. 向前预读寻找闭合符
    let j = index + targetLength;
    let foundCloser = false;
    let closerIndex = -1;

    while (j < src.length) {
      // 完美跳过反斜杠转义，比如 `*foo\*bar*`
      if (src[j] === '\\' && j + 1 < src.length) {
        j += 2;
        continue;
      }

      if (src[j] === marker) {
        let closerLength = 0;
        let k = j;
        while (k < src.length && src[k] === marker) {
          closerLength++;
          k++;
        }

        // 校验闭合符 (Closer / Right-Flanking)
        const prevChar = src[j - 1] || '';
        let isValidCloser = !isWhitespace(prevChar); // 前面不能是空格

        // `_` 的词内闭合限制
        if (marker === '_' && isValidCloser) {
          const charAfter = src[j + closerLength] || '';
          if (isAlphanumeric(charAfter)) {
            isValidCloser = false;
          }
        }

        // 如果是一个合法的闭合符，并且它拥有足够的长度来抵消我们的 targetLength
        if (isValidCloser && closerLength >= targetLength) {
          foundCloser = true;
          closerIndex = j;
          break;
        }

        // 没通过校验，跳过这串假标记继续找
        j += closerLength;
        continue;
      }
      j++;
    }

    // 如果扫到行尾都没找到闭合符，宣告失败，退化为普通文本 '*'
    if (!foundCloser) return null;

    // 4. 提取中间的内容，并交由上下文递归解析！
    const innerText = src.slice(index + targetLength, closerIndex);
    const children = ctx.parseInline(innerText);

    // 精确计算这段语法在源码中占用的绝对字符数
    const totalLength = (closerIndex + targetLength) - index;

    return {
      node: createNode(nodeType, totalLength, undefined, children),
      nextIndex: index + totalLength
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: any) {
    // 渲染层极度纯粹：通过 AST 节点类型自动分发标签，完美回收原本流浪在外的 renderStrong
    if (node.type === "strong") {
      return `<strong>${ctx.renderInline(node.children)}</strong>`;
    }
    return `<em>${ctx.renderInline(node.children)}</em>`;
  }
}

export default new EmphasisInlineParser();