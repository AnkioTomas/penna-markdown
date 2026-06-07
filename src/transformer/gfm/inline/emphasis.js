/**
 * 行内语法：斜体 *text* 或 _text_（定界符入栈见 delimiters.js，匹配由 finalizer 收尾）
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";
import { parseEmphasisDelim } from "@/transformer/gfm/inline/delimiters.js";

class EmphasisInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "emphasis", priority: 30 });
  }

  parse(src, index, ctx) {
    if (!ctx.store.hasInlineFrame()) return null;
    if (src[index] !== "*" && src[index] !== "_") return null;
    if (isEscaped(src, index)) return null;
    return parseEmphasisDelim(src, index, ctx);
  }

  render(node, ctx) {
    return `<em>${ctx.renderInline(node.children)}</em>`;
  }
}

export default new EmphasisInlineParser();
