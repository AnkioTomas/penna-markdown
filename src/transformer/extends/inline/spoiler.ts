/**
 * @file 行内剧透语法
 * @module transformer/extends/inline/spoiler
 *
 * 语法：`!!文字!!`（开闭定界符，可选空格）
 * 点击显示：`!!文字!! {click}` 或 `!!文字!! {.click}`
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";
import { InlineParseContext } from "@/transformer/core/context/InlineParseContext";
import { RenderContext } from "@/transformer/core/context/RenderContext";
import {findAttr} from "@/transformer/extends/inline/html_attrs";

/** 开定界符 `!!` 长度 */
const OPEN_LEN = 2;

/**
 * 判断 htmlAttrs 是否启用点击显示模式（class=click 或布尔属性 click）。
 */
function isClickMode(htmlAttrs: string | undefined): boolean {
  if (!htmlAttrs) return false;
  if (htmlAttrs === "click") return true;
  return /\bclass="[^"]*\bclick\b/.test(htmlAttrs);
}

/** 去掉 click 模式标记，避免 afterRender 重复注入到 label */
export function attrsWithoutClick(htmlAttrs: string | undefined): string {
  if (!htmlAttrs || htmlAttrs === "click") return "";
  if (htmlAttrs === 'class="click"') return "";
  return htmlAttrs
    .replace(/\bclass="click"\s*/, "")
    .replace(/\bclass="([^"]*)\bclick\b\s*([^"]*)"/, (_, a, b) => {
      const merged = `${a} ${b}`.trim();
      return merged ? `class="${merged}"` : "";
    })
    .trim();
}

/**
 * 从 contentStart 起查找剧透闭合定界符 `!!` 的起始索引。
 */
function findSpoilerClose(src: string, contentStart: number): number {
  const closeMarker = "!!";
  let i = contentStart;
  while (i <= src.length - 2) {
    const idx = src.indexOf(closeMarker, i);
    if (idx === -1) return -1;
    if (!isEscaped(src, idx)) {
      return idx;
    }
    i = idx + 1;
  }
  return -1;
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

    const contentStart = index + OPEN_LEN;
    const closeStart = findSpoilerClose(src, contentStart);
    if (closeStart === -1) return null;

    const inner = src.slice(contentStart, closeStart);
    if (inner.length === 0) return null;
    let closeIndex = closeStart + 2;


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