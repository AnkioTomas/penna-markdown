/**
 * @file 行内语法：链接
 * @module transformer/gfm/inline/links
 *
 * 行内链接：inline、full/collapsed/shortcut reference 形式。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml, htmlAttr } from "@/transformer/utils/escape.js";
import { parseInlineLinkParen } from "@/transformer/utils/linkDestination.js";
import {
  containsNestedLink,
  findLinkLabelEnd,
  findLinkTextEnd,
} from "@/transformer/utils/linkLabel.js";
import { normalizeLinkRefLabel } from "@/transformer/utils/normalize.js";
import type { InlineParseContext } from "@/transformer/core/context/InlineParseContext";
import type { RenderContext } from "@/transformer/core/context/RenderContext";

class LinkInlineParser extends BaseInlineParser {
  constructor() {
    super("link");
  }

  canOpenAt(src: string, index: number, _ctx: InlineParseContext): boolean {
    if (src[index] !== "[") return false;
    if (index > 0 && src[index - 1] === "!") return false;
    return true;
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext) {
    const labelEnd = findLinkTextEnd(src, index + 1);
    if (labelEnd === -1) return null;

    const labelText = src.slice(index + 1, labelEnd);
    const nextIndex = labelEnd + 1;
    const children = ctx.parseInline(labelText);

    if (containsNestedLink(children)) return null;

    if (nextIndex < src.length && src[nextIndex] === "(") {
      const inline = parseInlineLinkParen(src, nextIndex);
      if (inline) {
        return this.createResolvedLinkNode(index, inline.next, inline.href, inline.title, children);
      }

      const def = this.lookupReference(ctx, labelText);
      if (def) {
        return this.createResolvedLinkNode(index, nextIndex, def.href, def.title, children);
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
        return this.createResolvedLinkNode(index, refLabelEnd + 1, def.href, def.title, children);
      }
    }

    const def = this.lookupReference(ctx, labelText);
    if (def) {
      return this.createResolvedLinkNode(index, nextIndex, def.href, def.title, children);
    }

    return null;
  }

  private lookupReference(ctx: InlineParseContext, label: string) {
    const key = "ref_" + normalizeLinkRefLabel(label);
    return ctx.store.get<{ href: string; title: string }>(key) ?? null;
  }

  private createResolvedLinkNode(
    startIndex: number,
    endIndex: number,
    href: string,
    title: string,
    children: MarkdownNode[],
  ) {
    return {
      node: createNode("link", endIndex - startIndex, undefined, children, { href, title }),
      nextIndex: endIndex,
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext) {
    const inner = ctx.renderInline(node.children);
    const href = (node.props?.href as string) || "";
    const title = (node.props?.title as string) || "";
    return `<a href="${escapeHtml(href)}"${htmlAttr("title", title)}>${inner}</a>`;
  }
}

export default new LinkInlineParser();
