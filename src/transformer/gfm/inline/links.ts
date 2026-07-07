/**
 * @file 行内语法：链接
 * @module transformer/gfm/inline/links
 *
 * 行内链接：inline、full/collapsed reference；shortcut 由 link_reference_value 处理。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { renderSafeAnchor } from "@/transformer/utils/safeUrl.js";
import {
  parseInlineLinkParen,
  scanFailedAngleInlineLinkEnd,
} from "@/transformer/utils/linkDestination.js";
import {
  containsNestedLink,
  findLinkLabelEnd,
  findLinkTextEnd,
} from "@/transformer/utils/linkLabel.js";
import {
  collectFullReferenceCandidates,
  findReferenceWindowEnd,
  renderReferenceLinkSpan,
} from "@/transformer/utils/linkReference.js";
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
        return this.createInlineLinkNode(
          index,
          inline.next,
          inline.href,
          inline.title,
          children,
        );
      }
      const failedEnd = scanFailedAngleInlineLinkEnd(src, nextIndex);
      if (failedEnd !== -1) {
        return {
          node: createNode(
            "link",
            failedEnd - index,
            src.slice(index, failedEnd),
            undefined,
            { literal: true },
          ),
          nextIndex: failedEnd,
        };
      }
      return null;
    }

    if (nextIndex < src.length && src[nextIndex] === "[") {
      const refLabelEnd = findLinkLabelEnd(src, nextIndex + 1);
      if (refLabelEnd !== -1) {
        const end = refLabelEnd + 1;
        const windowEnd = findReferenceWindowEnd(src, index);
        const window = src.slice(index, windowEnd);
        return {
          node: createNode(
            "link",
            windowEnd - index,
            src.slice(index, end),
            children,
            {
              refWindow: window,
              refCandidates: collectFullReferenceCandidates(
                window,
                ctx.parseInline.bind(ctx),
              ),
            },
          ),
          nextIndex: windowEnd,
        };
      }
    }

    return null;
  }

  private createInlineLinkNode(
    startIndex: number,
    endIndex: number,
    href: string,
    title: string,
    children: MarkdownNode[],
  ) {
    return {
      node: createNode("link", endIndex - startIndex, undefined, children, {
        href,
        title,
      }),
      nextIndex: endIndex,
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext) {
    if (node.props?.literal) return node.value ?? "";

    const refCandidates = node.props?.refCandidates;
    if (refCandidates && node.value) {
      const window = (node.props?.refWindow as string) || node.value;
      return renderReferenceLinkSpan(
        window,
        refCandidates as Parameters<typeof renderReferenceLinkSpan>[1],
        ctx,
        node.value,
      );
    }

    const inner = ctx.renderInline(node.children);
    const href = (node.props?.href as string) || "";
    const title = (node.props?.title as string) || "";
    return renderSafeAnchor(href, inner, title);
  }
}

export default new LinkInlineParser();
