/**
 * @file 语法解析器基类
 * @module transformer/core/ParserBase
 */

import type { MarkdownNode } from "@/transformer/core/MarkdownNode";
import { InlineParseContext } from "@/transformer/core/context/InlineParseContext";
import { RenderContext } from "@/transformer/core/context/RenderContext";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";

/** 0-based 半开区间 [startLine, endLine)。 */
export interface LineRange {
  startLine: number;
  endLine: number;
}

export interface InlineParseResult {
  node: MarkdownNode;
  nextIndex: number;
}

export interface BlockParseResult {
  node?: MarkdownNode | null;
  nextIndex: number;
}

/** 单个 parser 的 options */
export type ParserOptions = Record<string, unknown>;

/** TransformerEngine.syntaxOptions 分发结构 */
export type SyntaxOptions = Record<string, ParserOptions>;

/** 行内语法解析器基类 */
export abstract class BaseInlineParser {
  readonly type: string;
  /** 强打断：emphasis/strong 预读扫描时跳过（默认 true，如 code span） */
  readonly strongBreak: boolean;
  private options: ParserOptions = {};

  protected constructor(type: string, strongBreak = true) {
    this.type = type;
    this.strongBreak = strongBreak;
  }

  setOptions(options: ParserOptions): void {
    this.options = { ...this.options, ...options };
  }

  clearOptions(): void {
    this.options = {};
  }

  getOptions(): ParserOptions {
    return this.options;
  }

  canOpenAt(src: string, index: number, ctx: InlineParseContext): boolean {
    return false;
  }

  parse(
    src: string,
    index: number,
    ctx: InlineParseContext,
  ): InlineParseResult | null {
    return null;
  }

  render(
    node: MarkdownNode,
    ctx: RenderContext,
    html: object = { html: "" },
  ): string {
    return "";
  }
}

/** 块级语法解析器基类 */
export abstract class BaseBlockParser {
  readonly type: string;
  /** 强打断：打断段落 / list 行收集等（默认 true） */
  readonly strongBreak: boolean;
  private options: ParserOptions = {};

  protected constructor(type: string, strongBreak = true) {
    this.type = type;
    this.strongBreak = strongBreak;
  }

  setOptions(options: ParserOptions): void {
    this.options = { ...this.options, ...options };
  }

  clearOptions(): void {
    this.options = {};
  }

  getOptions(): ParserOptions {
    return this.options;
  }

  /** 轻量级预检：是否可在 index 行开启本语法（禁止写入 store） */
  canOpenAt(lines: string[], index: number, ctx: BlockParseContext): boolean {
    return true;
  }

  parse(
    lines: string[],
    index: number,
    ctx: BlockParseContext,
  ): BlockParseResult | null {
    return null;
  }

  render(node: MarkdownNode, ctx: RenderContext): string {
    return "";
  }

  /** 块根元素上的源码行号属性。 */
  protected sourceLineAttrs(node: MarkdownNode): string {
    const options = this.getOptions();
    if (!options.sourceLineMap) return "";
    const id = node.props?.id ? String(node.props.id) : ``;

    if (id === "") return "";

    return ` data-hash="${id}"`;
  }
}
