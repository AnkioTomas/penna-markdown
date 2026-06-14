import { BaseInlineParser, InlineParseResult } from "@/transformer/core/ParserBase";
import { InlineParseContext } from "@/transformer/core/context/InlineParseContext";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode";
import { RenderContext } from "@/transformer/core/context/RenderContext";
import { escapeHtml, htmlAttr } from "@/transformer/utils/escape";
import { findLinkTextEnd } from "@/transformer/utils/linkLabel";
import { normalizeLinkRefLabel } from "@/transformer/utils/normalize";

/**
 * 仅处理已定义 shortcut reference：`[label]` 后不接 `(` / `[`，且 store 中有对应定义。
 * 完整链接语义由 links 解析器负责。
 */
class LinkReferenceValueParser extends BaseInlineParser {
  constructor() {
    super("link_reference_value");
  }

  canOpenAt(src: string, index: number, _ctx: InlineParseContext): boolean {
    if (src[index] !== "[") return false;
    if (index > 0 && src[index - 1] === "!") return false;
    return true;
  }

  parse(src: string, index: number, ctx: InlineParseContext): InlineParseResult | null {
    const end = findLinkTextEnd(src, index + 1);
    if (end === -1) return null;

    const nextIndex = end + 1;
    if (nextIndex < src.length) {
      const next = src[nextIndex];
      if (next === "(" || next === "[") return null;
    }

    const id = src.slice(index + 1, end);
    const label = "ref_" + normalizeLinkRefLabel(id);
    if (!ctx.store.get<{ href: string; title: string }>(label)) return null;

    return {
      node: createNode(this.type, nextIndex - index, undefined, [], { label, id }),
      nextIndex,
    };
  }

  render(node: MarkdownNode, ctx: RenderContext): string {
    const label = node.props?.label as string;
    const id = node.props?.id as string;
    const result = ctx.store.get<{ href: string; title: string }>(label);
    if (!result) return `[${id}]`;

    const title = result.title || "";
    return `<a href="${escapeHtml(result.href)}"${htmlAttr("title", title)}>${escapeHtml(id)}</a>`;
  }
}

export default new LinkReferenceValueParser();
