import {ParserStore} from "@/transformer/core/ParserStore";
import {MarkdownNode} from "@/transformer/core/MarkdownNode";

export interface BlockParseContext {
    readonly store: ParserStore;
    isBlockStarter(lines: string[], index: number): boolean
    parseInline(text: string): MarkdownNode[];
    parseBlocks(lines: string[]): MarkdownNode[];
    // 标记某行在容器内部
    markLineInContainer(lines:string[],index: number):void;
    markLinesInContainer(lines:string[]):void;
    // 判断某行是否在容器内部
    inContainer(lines:string[],index:number):boolean;

}
