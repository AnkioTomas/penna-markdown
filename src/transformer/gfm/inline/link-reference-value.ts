import {
  BaseInlineParser,
  InlineParseResult,
} from "@/transformer/core/ParserBase";
import { InlineParseContext } from "@/transformer/core/context/InlineParseContext";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode";
import { RenderContext } from "@/transformer/core/context/RenderContext";
import { isEscaped } from "@/transformer/utils/escape";
import { renderSafeAnchor } from "@/transformer/utils/safeUrl.js";
import {
  parseInlineLinkParen,
  scanFailedAngleInlineLinkEnd,
} from "@/transformer/utils/linkDestination";
import { findLinkTextEnd } from "@/transformer/utils/linkLabel";
import { normalizeLinkRefLabel } from "@/transformer/utils/normalize";

/**
 * Shortcut reference：`[label]`（后不接 `(` / `[`）。
 * parse 只建节点；render 再查 store。
 */
class LinkReferenceValueParser extends BaseInlineParser {
  constructor() {
    super("link_reference_value");
  }

  canOpenAt(src: string, index: number, _ctx: InlineParseContext): boolean {
    if (src[index] !== "[") return false;
    if (index > 0 && src[index - 1] === "!" && !isEscaped(src, index - 1))
      return false;
    return true;
  }

  parse(
    src: string,
    index: number,
    _ctx: InlineParseContext,
  ): InlineParseResult | null {
    const end = findLinkTextEnd(src, index + 1);
    if (end === -1) return null;

    const nextIndex = end + 1;
    if (nextIndex < src.length) {
      const next = src[nextIndex];
      if (next === "[") return null;
      if (next === "(") {
        if (parseInlineLinkParen(src, nextIndex)) return null;
        if (scanFailedAngleInlineLinkEnd(src, nextIndex) !== -1) return null;
      }
    }

    const labelText = src.slice(index + 1, end);
    const label = "ref_" + normalizeLinkRefLabel(labelText);
    const children = _ctx.parseInline(labelText);

    return {
      node: createNode(this.type, nextIndex - index, undefined, children, {
        label,
      }),
      nextIndex,
    };
  }

  render(node: MarkdownNode, ctx: RenderContext): string {
    const label = node.props?.label as string;
    const inner = ctx.renderInline(node.children);
    const result = ctx.store.get<{ href: string; title: string }>(label);
    if (!result) return `[${inner}]`;

    const title = result.title || "";
    return renderSafeAnchor(result.href, inner, title);
  }
}

export default new LinkReferenceValueParser();
