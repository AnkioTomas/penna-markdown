/**
 * @file 语法解析器基类
 * @module transformer/core/ParserBase
 */

import type { MarkdownNode } from "./MarkdownNode.js";
import {InlineParseContext} from "@/transformer/core/context/InlineParseContext";
import {RenderContext} from "@/transformer/core/context/RenderContext";
import {BlockParseContext} from "@/transformer/core/context/BlockParseContext";

export interface InlineParseResult {
  node: MarkdownNode;
  nextIndex: number;
}

export interface BlockParseResult {
  node?: MarkdownNode | null;
  nextIndex: number;
}

/** 行内语法解析器基类 */
export abstract class BaseInlineParser {
  readonly type: string;
  private options: Record<string, any> = {};

  protected constructor(type: string) {
    this.type = type;
  }

  setOptions(options:Record<string, any>): void {
    this.options = options;
  }

  canOpenAt(
      src: string,
      index: number,
      ctx: InlineParseContext,
  ): boolean {
    return true;
  }


  parse(
    src: string,
    index: number,
    ctx: InlineParseContext,
  ): InlineParseResult | null {
    return null;
  }

  render(node: MarkdownNode, ctx: RenderContext): string {
    return "";
  }
}

/** 块级语法解析器基类 */
export abstract class BaseBlockParser {
  readonly type: string;
  private options: Record<string, any> = {};
  protected constructor(type: string) {
    this.type = type;
  }
  setOptions(options:Record<string, any>): void {
    this.options = options;
  }
  /** 轻量级预检：是否可在 index 行开启本语法（禁止写入 store） */
  canOpenAt(
    lines: string[],
    index: number,
    ctx: BlockParseContext,
  ): boolean {
    return true;
  }

  parse(
      lines: string[],
      index: number,
      ctx: BlockParseContext,
  ): BlockParseResult | null {
    return null;
  }

  render(node: MarkdownNode,ctx: RenderContext): string {
    return "";
  }
}
