import {ParserStore} from "@/transformer/core/ParserStore";
import {MarkdownNode} from "@/transformer/core/MarkdownNode";

export interface BlockParseContext {
    readonly store: ParserStore;
    isBlockStarter(line: string): boolean
    parseInline(text: string): MarkdownNode[];
    parseBlocks(lines: string[]): MarkdownNode[];
}
