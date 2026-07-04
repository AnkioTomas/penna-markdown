/**
 * @file 块级语法拓展：字段
 * @module transformer/extends/block/field/field
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, type MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import { blockLength, readTripleColonBlock } from "../card/shared.js";
import { parseFieldDirectives } from "./shared.js";

const OPEN_RE = /^ {0,3}:::(?!:)\s+field(?:\s+(\S+))?\s*$/;

function resolveFieldStatus(props: Record<string, unknown>): "required" | "optional" | "deprecated" {
  if (props.deprecated) return "deprecated";
  if (props.required) return "required";
  return "optional";
}

class FieldBlockParser extends BaseBlockParser {
  constructor() {
    super("field");
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return OPEN_RE.test(lines[index] ?? "");
  }

  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const block = readTripleColonBlock(lines, index, OPEN_RE);
    if (!block) return null;

    const fieldName = String(block.attrs ?? "").trim();
    if (!fieldName) return null;

    const meta = parseFieldDirectives(normalizeInnerLines(block.innerLines));
    const children = ctx.parseBlocks(normalizeInnerLines(meta.bodyLines));

    return {
      node: createNode(
        this.type,
        blockLength(lines, index, block.nextIndex),
        undefined,
        children,
        {
          name: fieldName,
          fieldType: meta.type,
          required: meta.required,
          optional: meta.optional,
          deprecated: meta.deprecated,
          defaultValue: meta.defaultValue,
        },
      ),
      nextIndex: block.nextIndex,
    };
  }

  render(node: MarkdownNode, ctx: RenderContext) {
    const props = node.props ?? {};
    const status = resolveFieldStatus(props);
    const name = escapeHtml(String(props.name ?? ""));
    const fieldType = String(props.fieldType ?? "");
    const defaultValue = String(props.defaultValue ?? "");

    const statusLabel =
      status === "required"
        ? "Required"
        : status === "deprecated"
          ? "Deprecated"
          : "Optional";

    const typeHtml = fieldType
      ? `<span class="cherry-field__type"><code>${escapeHtml(fieldType)}</code></span>`
      : "";

    const defaultHtml = defaultValue
      ? `<p class="cherry-field__default"><code>${escapeHtml(defaultValue)}</code></p>`
      : "";

    const descriptionHtml = ctx.renderBlock(node.children ?? []);

    return [
      `<div class="cherry-field cherry-field--${status}"${this.sourceLineAttrs(node)}>`,
      `<div class="cherry-field__head">`,
      `<div class="cherry-field__meta">`,
      `<span class="cherry-field__name">${name}</span>`,
      `<span class="cherry-field__tag cherry-field__tag--${status}">${statusLabel}</span>`,
      `</div>`,
      typeHtml,
      `</div>`,
      defaultHtml,
      `<div class="cherry-field__description">${descriptionHtml}</div>`,
      `</div>`,
    ].join("");
  }
}

export const fieldBlockParser = new FieldBlockParser();
