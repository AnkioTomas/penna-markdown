/**
 * @file 行内高亮语法
 * @module transformer/extends/inline/highlight
 *
 * 语法：`==text==`，渲染为 `<mark>` 元素。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { InlineParseContext } from "@/transformer/core/context/InlineParseContext";

/**
 * 行内高亮解析器。
 *
 * @extends {BaseInlineParser}
 */
class HighlightInlineParser extends BaseInlineParser {
  constructor() {
    super("highlight",true);
  }

  canOpenAt(src: string, index: number, ctx: InlineParseContext): boolean {
    return src[index] === "=" && src[index + 1] === "=";
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext) {
    // 此时 canOpenAt 已经确保了 src 必定以 '==' 开始
    const startIndex = index + 2; // 提取实际内容的起始位置
    let endIndex = -1;

    // 从内容起始处开始逐字遍历，寻找闭合的 '=='
    for (let i = startIndex; i < src.length - 1; i++) {
      if (src[i] === "=" && src[i + 1] === "=") {
        endIndex = i;
        break; // 找到第一个匹配的闭合定界符即可停止
      }

      if(ctx.canStrongBreak(src,i,true)) return null;
    }

    // 如果遍历到字符串末尾也没有找到闭合的 '=='，则解析失败
    if (endIndex === -1) {
      return null;
    }

    const content = src.substring(startIndex, endIndex);

    // 原正则 /==([\s\S]+?)==/ 中的 +? 要求内容区至少有 1 个字符
    // 若你想支持 "====" 解析为空白高亮，可将这段判断删除
    if (content.length === 0) {
      return null;
    }

    // 计算整个语法的总长度: 闭合标识符开始位置 + 2(闭合标识符的长度) - 开始寻找的索引
    const totalLength = endIndex + 2 - index;

    return {
      node: createNode(
          this.type,
          totalLength,
          undefined,
          ctx.parseInline(content)
      ),
      nextIndex: index + totalLength,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    return `<mark class="cherry-mark">${ctx.renderInline(node.children)}</mark>`;
  }
}

export default new HighlightInlineParser();