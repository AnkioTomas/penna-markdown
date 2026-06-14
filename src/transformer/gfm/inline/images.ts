/**
 * @file 行内语法：图片
 * @module transformer/gfm/inline/images
 *
 * 行内图片：inline、full/collapsed/shortcut reference 形式。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml, htmlAttr } from "@/transformer/utils/escape.js";
import { parseInlineLinkParen } from "@/transformer/utils/linkDestination.js";
import { findLinkLabelEnd, findLinkTextEnd } from "@/transformer/utils/linkLabel.js";
import { normalizeLinkRefLabel } from "@/transformer/utils/normalize.js";
import type { InlineParseContext } from "@/transformer/core/context/InlineParseContext";

class ImageInlineParser extends BaseInlineParser {
  constructor() {
    super("image");
  }

  canOpenAt(src: string, index: number, _ctx: InlineParseContext): boolean {
    return src[index] === "!" && src[index + 1] === "[";
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext) {
    if (src[index] !== "!" || src[index + 1] !== "[") return null;

    const labelEnd = findLinkTextEnd(src, index + 2);
    if (labelEnd === -1) return null;

    const labelText = src.slice(index + 2, labelEnd);
    const nextIndex = labelEnd + 1;
    const children = ctx.parseInline(labelText);

    if (nextIndex < src.length && src[nextIndex] === "(") {
      const inline = parseInlineLinkParen(src, nextIndex);
      if (inline) {
        return this.createResolvedImageNode(index, inline.next, inline.href, inline.title, children);
      }

      const def = this.lookupReference(ctx, labelText);
      if (def) {
        return this.createResolvedImageNode(index, nextIndex, def.href, def.title, children);
      }
      return null;
    }

    if (nextIndex < src.length && src[nextIndex] === "[") {
      const refLabelEnd = findLinkLabelEnd(src, nextIndex + 1);
      if (refLabelEnd !== -1) {
        const refLabel = src.slice(nextIndex + 1, refLabelEnd);
        const refId = refLabel.length > 0 ? refLabel : labelText;
        const def = this.lookupReference(ctx, refId);
        if (!def) return null;
        return this.createResolvedImageNode(index, refLabelEnd + 1, def.href, def.title, children);
      }
    }

    const def = this.lookupReference(ctx, labelText);
    if (def) {
      return this.createResolvedImageNode(index, nextIndex, def.href, def.title, children);
    }

    return null;
  }

  private lookupReference(ctx: InlineParseContext, label: string) {
    const key = "ref_" + normalizeLinkRefLabel(label);
    return ctx.store.get<{ href: string; title: string }>(key) ?? null;
  }

  private createResolvedImageNode(
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

  private renderAlt(nodes: MarkdownNode[]): string {
    return nodes
      .map((n) => {
        if (n.type === "text") return n.value || "";
        if (n.children) return this.renderAlt(n.children);
        return "";
      })
      .join("");
  }

  /** @inheritdoc */
  render(node: MarkdownNode) {
    const alt = this.renderAlt(node.children || []);
    const href = (node.props?.href as string) || "";
    const title = (node.props?.title as string) || "";
    return `<img src="${escapeHtml(href)}" alt="${escapeHtml(alt)}"${htmlAttr("title", title)} />`;
  }
}

export default new ImageInlineParser();
