/**
 * @file 行内剧透语法
 * @module transformer/extends/inline/spoiler
 *
 * 语法：`!!文字!!`（开闭定界符，可选空格）
 * 点击显示：`!!文字!! {click}` 或 `!!文字!! {.click}`
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { InlineParseContext } from "@/transformer/core/context/InlineParseContext";
import { RenderContext } from "@/transformer/core/context/RenderContext";
import {findAttr} from "@/transformer/extends/inline/html_attrs";
import {isEscaped} from "@/transformer/utils/escape";


/**
 * 判断 htmlAttrs 是否启用点击显示模式（class=click 或布尔属性 click）。
 */
function isClickMode(htmlAttrs: string | undefined): boolean {
  if (!htmlAttrs) return false;
  if (htmlAttrs === "click") return true;
  return /\bclass="[^"]*\bclick\b/.test(htmlAttrs);
}

/**
 * 行内剧透解析器。
 *
 * @extends {BaseInlineParser}
 */
class SpoilerInlineParser extends BaseInlineParser {
  constructor() {
    super("spoiler");
  }

  canOpenAt(src: string, index: number, ctx: InlineParseContext): boolean {
    return src[index] === "!" && src[index + 1] === "!";
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext) {
    if (src[index] !== "!" || src[index + 1] !== "!") return null;
    if (isEscaped(src, index)) return null;

    const startIndex = index + 2;
    let endIndex = -1;
    for (let i = startIndex; i < src.length - 1; i++) {
      if (src[i] === "!" && src[i + 1] === "!") {
        endIndex = i;
        break; // 找到第一个匹配的闭合定界符即可停止
      }

      if(ctx.canStrongBreak(src,i,true)) return null;
    }

    if (endIndex === -1) {
      return null;
    }

    const inner = src.substring(startIndex, endIndex);
    if (inner.length === 0) return null;
    let closeIndex = endIndex + 2;


    let props = {};

    const attr = findAttr(src, closeIndex);

    if(attr.attr!=null) {
      props['htmlAttrs'] = attr.attr;
      closeIndex = attr.next
    }

    let matchLength = closeIndex - index;

    return {
      node: createNode(this.type, matchLength, undefined, ctx.parseInline(inner),props),
      nextIndex: closeIndex,
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext) {
    const inner = ctx.renderInline(node.children ?? []);
    const click = isClickMode(node.props?.htmlAttrs as string | undefined);

    if (click) {
      return `<label class="cherry-spoiler click"><input type="checkbox" class="cherry-spoiler__toggle" hidden><span class="cherry-spoiler__text">${inner}</span></label>`;
    }

    return `<span class="cherry-spoiler">${inner}</span>`;
  }
}

export default new SpoilerInlineParser();