/**
 * @file 行内语法：删除线
 * @module transformer/gfm/inline/strikethrough
 *
 * GFM 删除线：~~text~~。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext"; // 或对应的 InlineParseContext

/**
 * 删除线行内解析器。
 * * 纯游标扫描，完美支持转义符跳过，零正则开销。
 * @extends {BaseInlineParser}
 */
class StrikethroughInlineParser extends BaseInlineParser {
  constructor() {
    super("strikethrough", 9000);
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: any) {
    // 1. 极速快筛：不以 `~~` 开头，直接原路返回，0 内存分配
    if (src[index] !== '~' || src[index + 1] !== '~') {
      return null;
    }

    let i = index + 2;
    let closed = false;
    let innerEnd = i;

    // 2. 游标向后扫描寻找闭合的 `~~`
    while (i < src.length) {
      // 核心修复：遇到反斜杠转义，直接跳过后面的字符
      // 这样 `~~foo\~~bar~~` 就能完美被识别为删除线，且内容包含 `\~`
      if (src[i] === '\\' && i + 1 < src.length) {
        i += 2;
        continue;
      }

      // 找到闭合标志
      if (src[i] === '~' && src[i + 1] === '~') {
        innerEnd = i;
        closed = true;
        break;
      }

      i++;
    }

    // 未闭合，退化为普通文本
    if (!closed) return null;

    // GFM 规范要求：`~~~~`（中间无内容）不构成删除线，至少要有 1 个字符
    if (innerEnd === index + 2) return null;

    // 3. 提取内容并递归解析内联元素（如粗体、斜体、链接等）
    const innerText = src.slice(index + 2, innerEnd);
    const children = ctx.parseInline(innerText);

    // 计算在源码中占据的绝对长度
    const totalLength = (innerEnd + 2) - index;

    // 4. 构建标准化 AST 节点
    const node = createNode("strikethrough", totalLength, undefined, children);

    return { node, nextIndex: innerEnd + 2 };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: any) {
    // 渲染完全解耦，只管遍历 children
    return `<del>${ctx.renderInline(node.children)}</del>`;
  }
}

export default new StrikethroughInlineParser();