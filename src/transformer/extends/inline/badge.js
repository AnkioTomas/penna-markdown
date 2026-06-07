/**
 * 行内 Badge：[[文本]] / [[文本:颜色,位置]]
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";

const PREDEFINED_COLORS = new Set([
  "important",
  "info",
  "note",
  "tip",
  "warning",
  "danger",
]);

const POSITIONS = new Set(["top", "bottom", "center"]);

const BADGE_RE = /^\[\[([^:\]]+):?([^,\]]*)?,?([^\]]*)\]\]/;

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

class BadgeInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "badge", priority: 209 });
  }

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

  render(node) {
    const { text, clazz, style } = node.props;
    const styleAttr = style ? ` style="${style}"` : "";
    return `<span class="${clazz}"${styleAttr}>${escapeHtml(text)}</span>`;
  }
}

export default new BadgeInlineParser();
