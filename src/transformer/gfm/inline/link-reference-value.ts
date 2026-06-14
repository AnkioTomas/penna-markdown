import {BaseInlineParser, InlineParseResult} from "@/transformer/core/ParserBase";
import {InlineParseContext} from "@/transformer/core/context/InlineParseContext";
import {createNode, MarkdownNode} from "@/transformer/core/MarkdownNode";
import {RenderContext} from "@/transformer/core/context/RenderContext";
import {normalizeRefLabel} from "@/transformer/gfm/block/link-reference-definition";
import {escapeHtml} from "@/transformer/utils/escape";

class LinkReferenceValueParser extends BaseInlineParser {
    constructor() {
        super("link_reference_value", 2000);
    }

    canOpenAt(src: string, index: number, ctx: InlineParseContext): boolean {
        return src[index].startsWith("[");
    }

    parse(src: string, index: number, ctx: InlineParseContext): InlineParseResult | null {
        const end = findLinkTextEnd(src, index + 1);
        if (end == -1) return null;
        let id = src.substring(index + 1, end);
        let label = "ref_" + normalizeRefLabel(id);
        return {
            node: createNode(
                this.type, end - index + 1, undefined, [], {
                    label,
                    id
                }
            ), nextIndex: end + 1
        }
    }

    render(node: MarkdownNode, ctx: RenderContext): string {
        let label = node.props?.label as string;
        let id = node.props?.id as string;
        if (label == '') return `[${id}]`;
        let result = ctx.store.get<{ consumedCharIndex: number, id: string, href: string, title: string }>(label)

        if (result) {
            const title = result.title || "";
            const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
            return `<a href="${escapeHtml(result.href)}"${titleAttr}>${escapeHtml(id)}</a>`;
        }
        return `[${id}]`;
    }


}

export function findLinkTextEnd(src: string, start: number = 0) {
    for (let i = start; i < src.length; i++) {
        let char = src[i];
        if (char === ']' && src[i - 1] !== '\\') return i;
    }
    return -1;
}

export default new LinkReferenceValueParser();