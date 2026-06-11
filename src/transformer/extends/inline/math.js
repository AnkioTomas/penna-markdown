/**
 * @file 行内数学公式语法
 * @module transformer/extends/inline/math
 *
 * 语法：`$e^{i\pi}+1=0$`
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { parseInlineMathDelimited } from "@/transformer/extends/math/shared.js";
import { renderMathInline } from "@/transformer/extends/utils/cherryApi.js";

/**
 * 行内数学公式解析器。
 *
 * @extends {BaseInlineParser}
 */
class MathInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "math_inline", priority: 56 });
  }

  /** @inheritdoc */
  parse(src, index) {
    const parsed = parseInlineMathDelimited(src, index);
    if (!parsed) return null;

    return {
      node: createNode(this.type, { content: parsed.content }),
      nextIndex: parsed.nextIndex,
    };
  }

  /** @inheritdoc */
  render(node) {
    return renderMathInline(node.content ?? "");
  }
}

export default new MathInlineParser();
