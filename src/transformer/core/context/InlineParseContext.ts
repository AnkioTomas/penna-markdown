import { ParserStore } from "@/transformer/core/ParserStore";
import { MarkdownNode } from "@/transformer/core/MarkdownNode";
import type { InlineParseResult } from "@/transformer/core/ParserBase.js";
import type { ScannedPart } from "@/transformer/gfm/inline/emphasisProcess.js";

export interface InlineParseContext {
  readonly store: ParserStore;
  parseInline(text: string): MarkdownNode[];
  /** 是否存在可强打断当前 emphasis 预读扫描的行内结构 */
  canStrongBreak(src: string, index: number, strong?: boolean): boolean;
  /** text 批量收集时，是否有非 text 语法可在 index 处开启 */
  canOpenInlineAt(src: string, index: number): boolean;
  /** 在 index 处尝试解析一个行内结构（用于 emphasis 预读跳过） */
  parseInlineAt(
    src: string,
    index: number,
    strongBreak?: boolean,
  ): InlineParseResult | null;
  /** 同一 src 的 emphasis lex 结果缓存（lex once, match many） */
  getEmphasisLexParts(src: string): ScannedPart[];
}
