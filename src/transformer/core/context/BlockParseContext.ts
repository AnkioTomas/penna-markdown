import {ParserStore} from "@/transformer/core/ParserStore";
import {MarkdownNode} from "@/transformer/core/MarkdownNode";

export interface BlockParseContext {
    readonly store: ParserStore;
    /** @param strong 默认 true = 强打断块 */
    canStrongBreak(lines: string[], index: number, strong?: boolean): boolean;
    parseBlockAt(
        lines: string[],
        index: number,
        strongBreak?: boolean,
    ): { nextIndex: number; node: MarkdownNode | null };
    parseInline(text: string): MarkdownNode[];
    parseBlocks(lines: string[]): MarkdownNode[];
    markLineInContainer(lines:string[],index: number):void;
    markLinesInContainer(lines:string[]):void;
    inContainer(lines:string[],index:number):boolean;
}
