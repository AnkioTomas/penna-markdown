import {ParserStore} from "@/transformer/core/ParserStore";
import {MarkdownNode} from "@/transformer/core/MarkdownNode";

export interface BlockParseContext {
    readonly store: ParserStore;
    /** 当前是否在 blockquote 等禁止 setext 的容器块内 */
    inContainer(): boolean;
    enterContainer(): void;
    exitContainer(): void;
    /** @param strong 默认 true = 强打断块 */
    canStrongBreak(lines: string[], index: number, strong?: boolean): boolean;
    parseBlockAt(
        lines: string[],
        index: number,
        strongBreak?: boolean,
    ): { nextIndex: number; node: MarkdownNode | null };
    parseInline(text: string): MarkdownNode[];
    parseBlocks(lines: string[]): MarkdownNode[];
}
