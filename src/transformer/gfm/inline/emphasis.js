/**
 * @file 行内语法：斜体与加粗
 * @module transformer/gfm/inline/emphasis
 *
 * 斜体 *text* / _text_、加粗 **text** / __text__。
 * 定界符入栈见 delimiters.js，匹配由 inline finalizer 收尾。
 * strong 节点由 finalizer 生成，渲染见 renderStrong。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";
import { parseEmphasisDelim } from "@/transformer/gfm/inline/delimiters.js";

/**
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode} node
 * @param {import('@/transformer/core/ParserContext.js').RenderContext} ctx
 * @returns {string}
 */
export function renderStrong(node, ctx) {
  return `<strong>${ctx.renderInline(node.children)}</strong>`;
}

/**
 * 斜体（emphasis）行内解析器：识别定界符并入栈。
 *
 * @extends {BaseInlineParser}
 */
class EmphasisInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "emphasis", priority: 30 });
  }

  /** @inheritdoc */
  parse(src, index, ctx) {
    if (!ctx.store.hasInlineFrame()) return null;
    if (src[index] !== "*" && src[index] !== "_") return null;
    if (isEscaped(src, index)) return null;
    return parseEmphasisDelim(src, index, ctx);
  }

  /** @inheritdoc */
  render(node, ctx) {
    return `<em>${ctx.renderInline(node.children)}</em>`;
  }
}

export default new EmphasisInlineParser();
