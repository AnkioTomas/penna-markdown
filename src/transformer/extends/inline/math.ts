/**
 * @file 行内数学公式语法
 * @module transformer/extends/inline/math
 *
 * 语法：`$e^{i\pi}+1=0$`
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { InlineParseContext } from "@/transformer/core/context/InlineParseContext";
import { RenderContext } from "@/transformer/core/context/RenderContext";
import { isEscaped } from "@/transformer/utils/escape.js";
import { renderMathInline } from "@/transformer/extends/utils/cherryApi.js";

/**
 * 行内数学公式解析器。
 *
 * @extends {BaseInlineParser}
 */
class MathInlineParser extends BaseInlineParser {
  constructor() {
    super("math_inline");
  }

  canOpenAt(src: string, index: number, _ctx: InlineParseContext): boolean {
    return src[index] === "$" && !isEscaped(src, index);
  }

  /** @inheritdoc */
  parse(src: string, index: number, _ctx: InlineParseContext) {
    const startIndex = index + 1;
    const chars: string[] = [];
    let i = startIndex;

    for (; i < src.length;) {
      if (src[i] === "\\" && i + 1 < src.length) {
        chars.push(src.slice(i, i + 2));
        i += 2;
        continue;
      }

      if (src[i] === "$") {
        if (src[i + 1] === "$") return null;
        break;
      }

      chars.push(src[i]);
      i++;
    }

    if (i >= src.length) return null;

    const content = chars.join("");
    if (!content.trim()) return null;

    return {
      node: createNode(this.type, i + 1 - index, content),
      nextIndex: i + 1,
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, _ctx: RenderContext) {
    return renderMathInline(node.value ?? "");
  }
}

export default new MathInlineParser();
