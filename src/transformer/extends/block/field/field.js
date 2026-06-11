/**
 * @file 块级语法拓展：字段
 * @module transformer/extends/block/field/field
 *
 * ```
 * ::: field theme
 * @type ThemeConfig
 * @required
 * @default { base: '/' }
 * 主题配置
 * :::
 * ```
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import { readTripleColonBlock } from "../card/shared.js";
import { FIELD_BLOCK_PRIORITY, parseFieldDirectives } from "./shared.js";

const OPEN_RE = /^ {0,3}:::(?!:)\s+field(?:\s+(\S+))?\s*$/;

/**
 * @param {{
 *   required: boolean,
 *   optional: boolean,
 *   deprecated: boolean,
 * }} flags
 * @returns {"required" | "optional" | "deprecated"}
 */
function resolveFieldStatus(flags) {
  if (flags.deprecated) return "deprecated";
  if (flags.required) return "required";
  return "optional";
}

class FieldBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "field", priority: FIELD_BLOCK_PRIORITY });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const block = readTripleColonBlock(lines, index, OPEN_RE);
    if (!block) return null;

    const fieldName = String(block.attrs ?? "").trim();
    if (!fieldName) return null;

    const meta = parseFieldDirectives(normalizeInnerLines(block.innerLines));
    const children = ctx.parseBlocks(normalizeInnerLines(meta.bodyLines));

    return {
      node: createNode(this.type, {
        name: fieldName,
        fieldType: meta.type,
        required: meta.required,
        optional: meta.optional,
        deprecated: meta.deprecated,
        defaultValue: meta.defaultValue,
        children,
      }),
      nextIndex: block.nextIndex,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const status = resolveFieldStatus(node);
    const name = escapeHtml(String(node.name ?? ""));
    const fieldType = String(node.fieldType ?? "");
    const defaultValue = String(node.defaultValue ?? "");

    const statusLabel =
      status === "required"
        ? "Required"
        : status === "deprecated"
          ? "Deprecated"
          : "Optional";

    const typeHtml = fieldType
      ? `<span class="type"><code>${escapeHtml(fieldType)}</code></span>`
      : "";

    const defaultHtml = defaultValue
      ? `<p class="default-value"><code>${escapeHtml(defaultValue)}</code></p>`
      : "";

    const descriptionHtml = ctx.renderBlock(node.children ?? []);

    return [
      `<div class="cherry-field ${status}">`,
      `<div class="field-head">`,
      `<div class="field-meta">`,
      `<span class="name">${name}</span>`,
      `<span class="${status}">${statusLabel}</span>`,
      `</div>`,
      typeHtml,
      `</div>`,
      defaultHtml,
      `<div class="description">${descriptionHtml}</div>`,
      `</div>`,
    ].join("");
  }
}

export const fieldBlockParser = new FieldBlockParser();
