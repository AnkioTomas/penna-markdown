/**
 * @file 块级语法拓展：块级数学公式
 * @module transformer/extends/block/mathBlock
 *
 * 语法：`$$ ... $$`
 * 远程渲染：https://math-api-delta.vercel.app
 * 配置：`syntaxOptions.math_block`
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import { RenderContext } from "@/transformer/core/context/RenderContext";
import { escapeHtml } from "@/transformer/utils/escape.js";

/** 数学公式渲染 API 基址。 */
export const MATH_API_HOST = "https://math-api-delta.vercel.app";

/** `syntaxOptions.math_block` 可配置项 */
export interface MathBlockOptions {
  apiHost?: string;
}

export interface MathImageOptions {
  apiHost?: string;
  inline?: boolean;
  color?: string;
}

/** 块级数学开标记行：`$$`（非 `$$$`） */
const MATH_OPEN_RE = /^( {0,3})\$\$(?!\$)\s*(.*)$/;

function mathImgAttrs(latex: string, inline: boolean): string {
  const alt = escapeHtml(latex);
  const inlineAttr = inline ? ' data-inline="true"' : ' data-inline="false"';
  return `class="cherry-math-latex" data-latex="${alt}"${inlineAttr} alt="${alt}"`;
}

function stripClosingMath(line: string): string | null {
  const match = line.match(/^(.*?)\s*\$\$\s*$/);
  if (!match || !line.includes("$$")) return null;
  return match[1];
}

class MathBlockParser extends BaseBlockParser {
  constructor() {
    super("math_block");
  }

  buildMathImageSrc(
    content: string,
    { apiHost, inline = false, color }: MathImageOptions = {},
  ): string {
    const latex = content.trim();
    if (!latex) return "";
    const host = apiHost ?? (this.getOptions() as MathBlockOptions).apiHost ?? MATH_API_HOST;
    const param = inline ? "inline" : "from";
    let url = `${host}/?${param}=${encodeURIComponent(latex)}`;
    if (color) url += `&color=${encodeURIComponent(color)}`;
    return url;
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return MATH_OPEN_RE.test(lines[index] ?? "");
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, _ctx: BlockParseContext) {
    const line = lines[index] ?? "";
    const open = line.match(MATH_OPEN_RE);
    if (!open) return null;

    const tail = open[2];
    const sameLine = stripClosingMath(tail);
    if (sameLine !== null) {
      return {
        node: createNode(this.type, 1, sameLine),
        nextIndex: index + 1,
      };
    }

    const contentLines: string[] = [];
    if (tail.trim()) contentLines.push(tail);

    let i = index + 1;
    while (i < lines.length) {
      const ln = lines[i];
      if (/^\s*\$\$\s*$/.test(ln)) {
        return {
          node: createNode(this.type, i + 1 - index, contentLines.join("\n")),
          nextIndex: i + 1,
        };
      }

      const partial = stripClosingMath(ln);
      if (partial !== null) {
        if (partial) contentLines.push(partial);
        return {
          node: createNode(this.type, i + 1 - index, contentLines.join("\n")),
          nextIndex: i + 1,
        };
      }

      contentLines.push(ln);
      i += 1;
    }

    return null;
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext) {
    const latex = (node.value ?? "").trim();
    const color = ctx.isDark ? "white" : undefined;
    const src = this.buildMathImageSrc(latex, { color });
    if (!src) return "";
    return `<div class="cherry-math cherry-math-block" data-type="mathBlock"><img ${mathImgAttrs(latex, false)} src="${src}" loading="lazy" /></div>`;
  }
}

const mathBlockParser = new MathBlockParser();

export default mathBlockParser;