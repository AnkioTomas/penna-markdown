/**
 * @file 块级语法：Setext 标题 (===, ---)
 * @module transformer/gfm/block/setextHeading
 *
 * slug 配置见 `atx_heading.ts` 的 `syntaxOptions.atx_heading`
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import { skipBlockPrefixSpaces } from "@/transformer/utils/blockPrefix.js";
import { isBlankString } from "@/transformer/utils/normalize";
import {
  assignId,
  AtxHeadingOptions,
  renderHeadingHtml,
} from "@/transformer/gfm/block/atx_heading.js";

export function getSetextUnderlineInfo(line: string): number {
  let i = skipBlockPrefixSpaces(line);
  if (i >= line.length) return -1;

  const char = line[i];
  if (char !== "=" && char !== "-") return -1;
  const level = char === "=" ? 1 : 2;
  while (i < line.length && line[i] === char) i += 1;
  while (i < line.length && (line[i] === " " || line[i] === "\t")) i += 1;

  return i < line.length ? -1 : level;
}

class SetextHeadingBlockParser extends BaseBlockParser {
  // 优先级必须高于 Paragraph
  constructor() {
    super("setext_heading");
  }

  /** @inheritdoc */
  canOpenAt(lines: string[], index: number, ctx: BlockParseContext): boolean {
    const line = lines[index];
    if (isBlankString(line)) return false;
    if (ctx.inContainer()) return false;

    // 2. 抛出预读探针，往下扫！
    let i = index + 1;
    while (i < lines.length) {
      const line = lines[i];

      // 遇到空行，说明文本断了，没有下划线
      if (isBlankString(line)) return false;

      // 命中目标！这确实是个 Setext 标题
      if (getSetextUnderlineInfo(line) > 0) return true;

      i++;
    }
    return false;
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    let i = index;
    const contentLines: string[] = [];

    // 这里的逻辑和 canOpenAt 一模一样，只不过这次是真的吃掉它们
    while (i < lines.length) {
      const line = lines[i];
      const underline = getSetextUnderlineInfo(line);

      if (underline > 0) {
        const content = contentLines.join("\n");
        const store = ctx.store;
        const node = createNode(
          "setext_heading",
          i + 1 - index,
          content,
          ctx.parseInline(content),
          {
            level: underline,
            id: assignId(content, store),
          },
        );

        return { node, nextIndex: i + 1 };
      }

      // 吃掉文本
      contentLines.push(line);
      i++;
    }

    return null;
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext) {
    const sourceLineAttrs = this.sourceLineAttrs(node);

    return renderHeadingHtml(
      node,
      ctx,
      this.getOptions() as AtxHeadingOptions,
      sourceLineAttrs,
    );
  }
}

export default new SetextHeadingBlockParser();
