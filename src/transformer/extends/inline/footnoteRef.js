/**
 * 脚注引用：[^id]
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";
import { lookupFootnoteDefinition } from "@/transformer/extends/utils/footnote.js";

const FOOTNOTE_REF_RE = /^\[\^([^\]]+)\]/;

class FootnoteRefInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "footnote_ref", priority: 205 });
  }

  parse(src, index, ctx) {
    if (src[index] !== "[" || src[index + 1] !== "^") return null;
    if (isEscaped(src, index)) return null;

    const match = src.slice(index).match(FOOTNOTE_REF_RE);
    if (!match) return null;
    if (src[index + match[0].length] === ":") return null;

    const id = match[1];
    if (!lookupFootnoteDefinition(ctx.store, id)) return null;

    return {
      node: createNode(this.type, { id }),
      nextIndex: index + match[0].length,
    };
  }

  render(node) {
    const { id, num } = node.props;
    if (!num) return `[^${id}]`;
    return `<sup><a href="#fn:${num}" id="fnref:${num}" class="footnote" title="${id}">[${num}]</a></sup>`;
  }
}

export default new FootnoteRefInlineParser();
