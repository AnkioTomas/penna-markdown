/**
 * @file 行内剧透语法
 * @module transformer/extends/inline/spoiler
 *
 * 语法：`!! 文字 !!`（开闭定界符后均须有空格）
 * 点击显示：`!! 文字 !! {click}` 或 `!! 文字 !! {.click}`
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";
import { isWhitespace } from "@/transformer/utils/normalize.js";
import { injectAttrsIntoFirstOpenTag } from "@/transformer/extends/utils/injectAttrs.js";

/** 开定界符长度：`!!` + 必需空白 */
const OPEN_LEN = 3;

/**
 * 判断 htmlAttrs 是否启用点击显示模式（class=click 或布尔属性 click）。
 *
 * @param {string | undefined} htmlAttrs
 * @returns {boolean}
 */
function isClickMode(htmlAttrs) {
  if (!htmlAttrs) return false;
  if (htmlAttrs === "click") return true;
  return /\bclass="[^"]*\bclick\b/.test(htmlAttrs);
}

/**
 * 去掉 click 模式标记，返回剩余待注入属性。
 *
 * @param {string | undefined} htmlAttrs
 * @returns {string}
 */
function attrsWithoutClick(htmlAttrs) {
  if (!htmlAttrs || htmlAttrs === "click") return "";
  if (htmlAttrs === 'class="click"') return "";
  return htmlAttrs
    .replace(/\bclass="click"\s*/, "")
    .replace(/\bclass="([^"]*)\bclick\b\s*([^"]*)"/, (_, a, b) => {
      const merged = `${a} ${b}`.trim();
      return merged ? `class="${merged}"` : "";
    })
    .trim();
}

/**
 * 从 contentStart 起查找剧透闭合定界符 ` !!` 的起始索引。
 *
 * @param {string} src
 * @param {number} contentStart - 内容起始索引
 * @returns {number} 闭合空白字符的索引，未找到返回 -1
 */
function findSpoilerClose(src, contentStart) {
  const closeMarker = " !!";
  let i = contentStart;
  while (i <= src.length - 3) {
    const idx = src.indexOf(closeMarker, i);
    if (idx === -1) return -1;
    if (!isEscaped(src, idx + 1)) {
      return idx;
    }
    i = idx + 1;
  }
  return -1;
}

/**
 * 行内剧透解析器。
 *
 * @extends {BaseInlineParser}
 */
class SpoilerInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "spoiler", priority: 49 });
  }

  /** @inheritdoc */
  parse(src, index, ctx) {
    if (src[index] !== "!" || src[index + 1] !== "!") return null;
    if (isEscaped(src, index)) return null;
    if (!isWhitespace(src[index + 2])) return null;

    const contentStart = index + OPEN_LEN;
    const closeStart = findSpoilerClose(src, contentStart);
    if (closeStart === -1) return null;

    const inner = src.slice(contentStart, closeStart);
    if (inner.length === 0) return null;

    return {
      node: createNode(this.type, { children: ctx.parseInline(inner) }),
      nextIndex: closeStart + 3,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const inner = ctx.renderInline(node.children);
    const attrs = node.htmlAttrs;
    const click = isClickMode(attrs);

    if (click) {
      let html = `<label class="spoiler click"><input type="checkbox" class="spoiler__toggle" hidden><span class="spoiler__text">${inner}</span></label>`;
      const extra = attrsWithoutClick(attrs);
      if (extra) {
        html = injectAttrsIntoFirstOpenTag(html, extra);
      }
      delete node.htmlAttrs;
      return html;
    }

    let html = `<span class="spoiler">${inner}</span>`;
    if (attrs) {
      html = injectAttrsIntoFirstOpenTag(html, attrs);
      delete node.htmlAttrs;
    }
    return html;
  }
}

export default new SpoilerInlineParser();
