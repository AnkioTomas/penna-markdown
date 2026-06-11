/**
 * @file 块级语法拓展：字段组
 * @module transformer/extends/block/field/fieldGroup
 *
 * ```
 * :::: field-group
 * ::: field theme
 * @type ThemeConfig
 * @required
 * 主题配置
 * :::
 * ::::
 * ```
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import { readQuadColonBlock } from "../card/shared.js";
import { FIELD_GROUP_PRIORITY } from "./shared.js";

const OPEN_RE = /^ {0,3}::::(?!:)\s+field-group\s*$/;

class FieldGroupBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "field_group", priority: FIELD_GROUP_PRIORITY });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const block = readQuadColonBlock(lines, index, OPEN_RE);
    if (!block) return null;

    const children = ctx.parseBlocks(normalizeInnerLines(block.innerLines));
    const fields = children.filter((child) => child.type === "field");
    if (fields.length === 0) return null;

    return {
      node: createNode(this.type, { children: fields }),
      nextIndex: block.nextIndex,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const items = (node.children ?? [])
      .map((child) => ctx.renderBlock([child]))
      .join("");

    return `<div class="cherry-field-group">${items}</div>`;
  }
}

export const fieldGroupBlockParser = new FieldGroupBlockParser();
