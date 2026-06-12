import {ParserStore} from "@/transformer/core/ParserStore";
import {MarkdownNode} from "@/transformer/core/MarkdownNode";

export interface InlineParseContext {
    readonly store: ParserStore;
    parseInline(text: string): MarkdownNode[];
}
