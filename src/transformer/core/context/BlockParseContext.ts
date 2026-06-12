import {ParserStore} from "@/transformer/core/ParserStore";
import {MarkdownNode} from "@/transformer/core/MarkdownNode";

export interface BlockParseContext {
    readonly store: ParserStore;
    parseInline(text: string): MarkdownNode[];
    parseBlocks(lines: string[]): MarkdownNode[];
}
