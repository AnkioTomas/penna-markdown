/**
 * @file 脚注引用语法
 * @module transformer/extends/inline/footnoteRef
 *
 * 语法：`[^id]`，id 须在文档中存在对应脚注定义。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";
import { lookupFootnoteDefinition } from "@/transformer/extends/utils/footnote.js";

/** 脚注引用正则：`[^id]` */
const FOOTNOTE_REF_RE = /^\[\^([^\]]+)\]/;

/**
 * 脚注引用行内解析器。
 *
 * @extends {BaseInlineParser}
 */
class FootnoteRefInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "footnote_ref", priority: 205 });
  }

  /** @inheritdoc */
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

  /** @inheritdoc */
  render(node) {
    const { id, num } = node;
    if (!num) return `[^${id}]`;
    return `<sup><a href="#fn:${num}" id="fnref:${num}" class="footnote" title="${id}">[${num}]</a></sup>`;
  }
}

export default new FootnoteRefInlineParser();
