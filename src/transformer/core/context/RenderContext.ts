import {ParserStore} from "@/transformer/core/ParserStore";
import {MarkdownNode} from "@/transformer/core/MarkdownNode";

export interface RenderContext {
    readonly store: ParserStore;
    renderInline(nodes: MarkdownNode[]): string;
    renderBlock(nodes: MarkdownNode[]): string;
}