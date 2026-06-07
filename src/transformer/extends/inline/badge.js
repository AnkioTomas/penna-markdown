/**
 * @file 行内 Badge 语法
 * @module transformer/extends/inline/badge
 *
 * 语法：`[[文本]]` / `[[文本:颜色,位置]]`
 *
 * 颜色可为预定义名（important、info 等）、六位 hex，或作为位置 token；
 * 位置为 top / bottom / center。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";

/** 预定义 Badge 颜色 token */
const PREDEFINED_COLORS = new Set([
  "important",
  "info",
  "note",
  "tip",
  "warning",
  "danger",
]);

/** 允许的 Badge 垂直位置 token */
const POSITIONS = new Set(["top", "bottom", "center"]);

/** Badge 语法正则：`[[text]]` 或 `[[text:color,position]]` */
const BADGE_RE = /^\[\[([^:\]]+):?([^,\]]*)?,?([^\]]*)\]\]/;

/**
 * 根据文本与颜色、位置 token 解析 Badge 样式。
 *
 * @param {string} text - Badge 显示文本
 * @param {string} colorToken - 颜色或位置 token
 * @param {string} positionToken - 位置 token
 * @returns {{ text: string, clazz: string, style: string }}
 */
function resolveBadgeStyle(text, colorToken, positionToken) {
  let clazz = "cherry-badge ";
  let style = "";
  let position = "center";

  if (colorToken && PREDEFINED_COLORS.has(colorToken)) {
    clazz += `cherry-badge-${colorToken} `;
  } else if (colorToken && /^#[0-9a-fA-F]{6}$/.test(colorToken)) {
    clazz += "cherry-badge-info ";
    style = `background-color: ${colorToken}`;
  } else if (colorToken && POSITIONS.has(colorToken)) {
    clazz += "cherry-badge-info ";
    position = colorToken;
  } else {
    clazz += "cherry-badge-info ";
  }

  if (positionToken && POSITIONS.has(positionToken)) {
    position = positionToken;
  } else if (
    !positionToken &&
    colorToken &&
    POSITIONS.has(colorToken)
  ) {
    position = colorToken;
  }

  clazz += `cherry-badge-${position}`;
  return { text, clazz: clazz.trim(), style };
}

/**
 * 行内 Badge 解析器。
 *
 * @extends {BaseInlineParser}
 */
class BadgeInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "badge", priority: 209 });
  }

  /** @inheritdoc */
  parse(src, index) {
    if (src[index] !== "[" || src[index + 1] !== "[") return null;
    if (isEscaped(src, index)) return null;

    const match = src.slice(index).match(BADGE_RE);
    if (!match) return null;

    const badge = resolveBadgeStyle(
      match[1],
      match[2]?.trim() ?? "",
      match[3]?.trim() ?? "",
    );

    return {
      node: createNode(this.type, badge),
      nextIndex: index + match[0].length,
    };
  }

  /** @inheritdoc */
  render(node) {
    const { text, clazz, style } = node.props;
    const styleAttr = style ? ` style="${style}"` : "";
    return `<span class="${clazz}"${styleAttr}>${escapeHtml(text)}</span>`;
  }
}

export default new BadgeInlineParser();
