import { ParserStore } from "@/transformer/core/ParserStore";
import { MarkdownNode } from "@/transformer/core/MarkdownNode";
import type { InlineParseResult } from "@/transformer/core/ParserBase.js";

export interface InlineParseContext {
  readonly store: ParserStore;
  parseInline(text: string): MarkdownNode[];
  /** 是否存在可强打断当前 emphasis 预读扫描的行内结构 */
  canStrongBreak(src: string, index: number, strong?: boolean): boolean;
  /** 在 index 处尝试解析一个行内结构（用于 emphasis 预读跳过） */
  parseInlineAt(
    src: string,
    index: number,
    strongBreak?: boolean,
  ): InlineParseResult | null;
}
