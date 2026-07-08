/**
 * @file 行内 HTML 属性片段语法
 * @module transformer/extends/inline/html_attrs
 *
 * 语法：`{class="x"}` 等 HTML 属性片段。
 *
 * 语义：
 * - `{class="x"}` 解析为 `html_attrs` 节点
 * - 渲染时将属性注入到前一个兄弟节点的开标签
 *
 * 例如：`**bold**{class="x"}` -> `<strong class="x">bold</strong>`
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml, isEscaped } from "@/transformer/utils/escape.js";
import { isSafeUrl } from "@/transformer/utils/safeUrl.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext";
import type { InlineParseContext } from "@/transformer/core/context/InlineParseContext";

/**
 * 跳过 index 起的连续空白字符。
 */
function skipSpaces(str: string, i: number): number {
  while (i < str.length && /\s/.test(str[i])) i += 1;
  return i;
}

function isAllowedAttrName(key: string): boolean {
  const lower = key.toLowerCase();
  if (lower.startsWith("on")) return false;
  return true;
}

function skipAttrValue(str: string, i: number): number {
  i = skipSpaces(str, i);
  if (i >= str.length || str[i] !== "=") return i;
  i += 1;
  i = skipSpaces(str, i);
  if (i >= str.length) return i;

  const quote = str[i] === '"' || str[i] === "'" ? str[i] : "";
  if (quote) {
    i += 1;
    while (i < str.length) {
      if (str[i] === quote) {
        i += 1;
        break;
      }
      if (str[i] === "\\" && i + 1 < str.length) i += 2;
      else i += 1;
    }
    return i;
  }

  while (i < str.length && !/\s/.test(str[i])) i += 1;
  return i;
}

function isAllowedAttrValue(key: string, value: string): boolean {
  const lower = key.toLowerCase();
  if (
    lower === "href" ||
    lower === "src" ||
    lower === "poster" ||
    lower === "xlink:href"
  ) {
    return isSafeUrl(value);
  }
  return true;
}

/**
 * 判断字符是否为 XML/HTML 属性名起始字符。
 */
function isNameStart(ch: string): boolean {
  return /[A-Za-z_:]/.test(ch);
}

/**
 * 判断字符是否为 XML/HTML 属性名后续字符。
 */
function isNameChar(ch: string): boolean {
  return /[A-Za-z0-9_:-]/.test(ch);
}

/**
 * 将 `{...}` 内部解析为 HTML 属性字符串（已做 value 转义）。
 *
 * @param {string} inner - 花括号内的原始字符串
 * @returns {string | null} 属性字符串，如 `class="x" data-a="1"`；解析失败返回 null
 */
function parseAttrsString(inner: string): string | null {
  const str = String(inner);
  let i = 0;
  const out: string[] = [];
  const classes: string[] = [];

  while (i < str.length) {
    i = skipSpaces(str, i);
    if (i >= str.length) break;

    // 简化语法：.class 或 #id
    if (str[i] === "." || str[i] === "#") {
      const prefix = str[i];
      i += 1;
      const valueStart = i;
      while (i < str.length && isNameChar(str[i])) i += 1;
      const value = str.slice(valueStart, i);

      if (!value) return null;

      if (prefix === ".") {
        classes.push(value);
      } else {
        out.push(`id="${escapeHtml(value)}"`);
      }
      continue;
    }

    const keyStart = i;
    if (!isNameStart(str[i])) return null;
    i += 1;
    while (i < str.length && isNameChar(str[i])) i += 1;
    const key = str.slice(keyStart, i);
    if (!isAllowedAttrName(key)) {
      i = skipAttrValue(str, i);
      continue;
    }

    i = skipSpaces(str, i);

    // boolean attr
    if (str[i] !== "=") {
      out.push(key);
      continue;
    }

    // key=value
    i += 1; // skip '='
    i = skipSpaces(str, i);
    if (i >= str.length) return null;

    let value = "";
    const quote = str[i] === '"' || str[i] === "'" ? str[i] : "";
    if (quote) {
      i += 1; // skip quote
      while (i < str.length) {
        const ch = str[i];
        if (ch === "\\") {
          if (i + 1 < str.length) {
            value += str[i + 1];
            i += 2;
            continue;
          }
        }
        if (ch === quote) break;
        value += ch;
        i += 1;
      }
      if (i >= str.length || str[i] !== quote) return null;
      i += 1; // skip closing quote
    } else {
      const vStart = i;
      while (i < str.length && !/\s/.test(str[i])) i += 1;
      value = str.slice(vStart, i);
    }

    if (key === "class") {
      classes.push(...value.split(/\s+/).filter(Boolean));
    } else {
      if (!isAllowedAttrValue(key, value)) continue;
      out.push(`${key}="${escapeHtml(value)}"`);
    }
  }

  if (classes.length) {
    out.push(`class="${escapeHtml(classes.join(" "))}"`);
  }

  return out.join(" ");
}

function findClosedTag(src: string, index: number): number {
  let close = -1;
  for (let i = index + 1; i < src.length; i += 1) {
    if (src[i] === "\\") {
      i += 1;
      continue;
    }
    if (src[i] === "}") {
      close = i;
      break;
    }
  }
  return close;
}

export function findAttr(src: string, _index: number) {
  const index = skipSpaces(src, _index);
  if (src[index] !== "{") return { next: _index, attr: null };
  const close = findClosedTag(src, index);
  if (close === -1) return { next: _index, attr: null };
  const rawInner = src.slice(index + 1, close);
  const inner = rawInner.trim();
  return {
    next: close + 1,
    attr: parseAttrsString(inner),
  };
}

/**
 * HTML 属性片段行内解析器。
 *
 * @extends {BaseInlineParser}
 */
class HtmlAttrsInlineParser extends BaseInlineParser {
  constructor() {
    super("html_attrs", true);
  }

  canOpenAt(src: string, index: number, ctx: InlineParseContext): boolean {
    return src[index] === "{";
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext) {
    if (isEscaped(src, index)) return null;

    // 找最近的未转义 '}'
    const close = findClosedTag(src, index);

    if (close === -1) {
      return { node: createNode("text", 1, "{"), nextIndex: index + 1 };
    }

    const rawInner = src.slice(index + 1, close);
    const inner = rawInner.trim();
    if (!inner) {
      return {
        node: createNode("text", rawInner.length + 2, `{${rawInner}}`),
        nextIndex: close + 1,
      };
    }

    const attrsString = parseAttrsString(inner);
    if (attrsString === null) {
      return {
        node: createNode(
          "text",
          close + 1 - index,
          src.slice(index, close + 1),
        ),
        nextIndex: close + 1,
      };
    }

    return {
      node: createNode(this.type, close + 1 - index, undefined, undefined, {
        attrs: attrsString,
      }),
      nextIndex: close + 1,
    };
  }

  /** @inheritdoc */
  render(
    node: MarkdownNode,
    ctx: RenderContext,
    prev: { html: string } = { html: "" },
  ): string {
    prev.html = this.transformPrev(prev.html, node, ctx);
    return "";
  }

  transformPrev(
    prevHtml: string,
    node: MarkdownNode,
    _ctx: RenderContext,
  ): string {
    const attrs = node.props?.attrs as string | undefined;
    if (!attrs || !prevHtml || !prevHtml.startsWith("<")) return prevHtml;

    const gt = prevHtml.indexOf(">");
    if (gt === -1) return prevHtml;

    const before = prevHtml.slice(0, gt).replace(/\s*$/, "");
    const rest = prevHtml.slice(gt + 1);

    const existingClass = before.match(/\bclass="([^"]*)"/);
    const injectedClass = attrs.match(/\bclass="([^"]*)"/);

    if (existingClass && injectedClass) {
      const merged = `${existingClass[1]} ${injectedClass[1]}`.trim();
      const tag = before.replace(/\bclass="[^"]*"/, `class="${merged}"`);
      const other = attrs.replace(/\bclass="[^"]*"\s*/, "").trim();
      return other ? `${tag} ${other}>${rest}` : `${tag}>${rest}`;
    }

    if (before.endsWith("/")) {
      const base = before.slice(0, -1).replace(/\s*$/, "");
      return `${base} ${attrs} />${rest}`;
    }
    return `${before} ${attrs}>${rest}`;
  }
}

export default new HtmlAttrsInlineParser();
