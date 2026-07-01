/**
 * @file 脚注引用语法
 * @module transformer/extends/inline/footnoteRef
 *
 * 语法：`[^id]`
 *
 * parse 只建节点；finalize 编号；render 再查 store（无定义则回退字面量）。
 */

import { BaseInlineParser, InlineParseResult } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { InlineParseContext } from "@/transformer/core/context/InlineParseContext";
import { RenderContext } from "@/transformer/core/context/RenderContext";
import { isEscaped } from "@/transformer/utils/escape.js";
import { findLinkTextEnd } from "@/transformer/utils/linkLabel.js";

function footnoteRefId(num: number, refIndex: number): string {
  return refIndex === 1 ? `footnote-ref-${num}` : `footnote-ref-${num}-${refIndex}`;
}

class FootnoteRefInlineParser extends BaseInlineParser {
  constructor() {
    super("footnote_ref");
  }

  canOpenAt(src: string, index: number, _ctx: InlineParseContext): boolean {
    if (src[index] !== "[" || src[index + 1] !== "^") return false;
    return !isEscaped(src, index);
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext): InlineParseResult | null {
    const labelEnd = findLinkTextEnd(src, index + 1);
    if (labelEnd === -1) return null;

    const labelText = src.slice(index + 1, labelEnd);

    const id = labelText.slice(1);
    if (!id) return null;

    const nextIndex = labelEnd + 1;
    if (src[nextIndex] === ":") return null;

    return {
      node: createNode(this.type, nextIndex - index, undefined, undefined, { id }),
      nextIndex,
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, _ctx: RenderContext): string {
    const id = String(node.props?.id ?? "");
    const num = node.props?.num as number | undefined;
    const refIndex = (node.props?.refIndex as number | undefined) ?? 1;

    if (!num) return `[^${id}]`;

    return `<sup class="cherry-footnote-ref"><a href="#footnote-${num}" id="${footnoteRefId(num, refIndex)}">${num}</a></sup>`;
  }
}

export default new FootnoteRefInlineParser();
