/**
 * @file 行内语法：图片
 * @module transformer/gfm/inline/images
 *
 * 行内图片：inline、full/collapsed/shortcut reference 形式。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml, htmlAttr, isEscaped } from "@/transformer/utils/escape.js";
import { parseInlineLinkParen } from "@/transformer/utils/linkDestination.js";
import { findLinkLabelEnd, findLinkTextEnd } from "@/transformer/utils/linkLabel.js";
import { flattenImageAlt, renderReferenceImage } from "@/transformer/utils/linkReference.js";
import { normalizeLinkRefLabel, skipInlineWhitespace } from "@/transformer/utils/normalize.js";
import type { InlineParseContext } from "@/transformer/core/context/InlineParseContext";
import type { RenderContext } from "@/transformer/core/context/RenderContext";

class ImageInlineParser extends BaseInlineParser {
  constructor() {
    super("image");
  }

  canOpenAt(src: string, index: number, _ctx: InlineParseContext): boolean {
    if (src[index] !== "!" || src[index + 1] !== "[") return false;
    return !isEscaped(src, index);
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext) {
    if (src[index] !== "!" || src[index + 1] !== "[") return null;
    if (isEscaped(src, index)) return null;

    const labelEnd = findLinkTextEnd(src, index + 2);
    if (labelEnd === -1) return null;

    const labelText = src.slice(index + 2, labelEnd);
    const nextIndex = labelEnd + 1;
    const children = ctx.parseInline(labelText);

    let j = skipInlineWhitespace(src, nextIndex);

    if (j < src.length && src[j] === "(") {
      const inline = parseInlineLinkParen(src, j);
      if (inline) {
        return this.createInlineImageNode(index, inline.next, inline.href, inline.title, children);
      }
      return null;
    }

    if (j < src.length && src[j] === "[") {
      const refLabelEnd = findLinkLabelEnd(src, j + 1);
      if (refLabelEnd !== -1) {
        const end = refLabelEnd + 1;
        const refLabel = src.slice(j + 1, refLabelEnd);
        const refId = refLabel.length > 0 ? refLabel : labelText;
        return {
          node: createNode("image", end - index, undefined, children, {
            refKey: normalizeLinkRefLabel(refId),
          }),
          nextIndex: end,
        };
      }
    }

    return {
      node: createNode("image", j - index, undefined, children, {
        refKey: normalizeLinkRefLabel(labelText),
      }),
      nextIndex: j,
    };
  }

  private createInlineImageNode(
    startIndex: number,
    endIndex: number,
    href: string,
    title: string,
    children: MarkdownNode[],
  ) {
    return {
      node: createNode("image", endIndex - startIndex, undefined, children, { href, title }),
      nextIndex: endIndex,
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext) {
    const refKey = node.props?.refKey as string | undefined;
    if (refKey !== undefined) {
      return renderReferenceImage(refKey, node.children || [], ctx);
    }

    const alt = flattenImageAlt(node.children || []);
    const href = (node.props?.href as string) || "";
    const title = (node.props?.title as string) || "";
    return `<img src="${escapeHtml(href)}" alt="${escapeHtml(alt)}"${htmlAttr("title", title)} />`;
  }
}

export default new ImageInlineParser();
