/**
 * @file 块级语法拓展：字段组
 * @module transformer/extends/block/field/fieldGroup
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, type MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import { blockLength, readQuadColonBlock } from "../card/shared.js";

const OPEN_RE = /^ {0,3}::::(?!:)\s+field-group\s*$/;

class FieldGroupBlockParser extends BaseBlockParser {
  constructor() {
    super("field_group");
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return OPEN_RE.test(lines[index] ?? "");
  }

  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const block = readQuadColonBlock(lines, index, OPEN_RE);
    if (!block) return null;

    const children = ctx.parseBlocks(normalizeInnerLines(block.innerLines));
    const fields = children.filter((child) => child.type === "field");
    if (fields.length === 0) return null;

    return {
      node: createNode(
        this.type,
        blockLength(lines, index, block.nextIndex),
        undefined,
        fields,
      ),
      nextIndex: block.nextIndex,
    };
  }

  render(node: MarkdownNode, ctx: RenderContext) {
    const items = (node.children ?? [])
      .map((child) => ctx.renderBlock([child]))
      .join("");

    return `<div class="cherry-field-group"${this.sourceLineAttrs(node)}>${items}</div>`;
  }
}

export const fieldGroupBlockParser = new FieldGroupBlockParser();
