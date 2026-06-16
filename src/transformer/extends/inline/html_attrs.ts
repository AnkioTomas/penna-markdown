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
import { createNode, MarkdownNode} from "@/transformer/core/MarkdownNode.js";
import {escapeHtml, isEscaped} from "@/transformer/utils/escape.js";
import {RenderContext} from "@/transformer/core/context/RenderContext";
import { InlineParseContext } from "@/transformer/core/context/InlineParseContext";

/**
 * 跳过 index 起的连续空白字符。
 */
function skipSpaces(str: string, i: number): number {
  while (i < str.length && /\s/.test(str[i])) i += 1;
  return i;
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
      out.push(`${key}="${escapeHtml(value)}"`);
    }
  }

  if (classes.length) {
    out.push(`class="${escapeHtml(classes.join(" "))}"`);
  }

  return out.length > 0 ? out.join(" ") : null;
}

/**
 * HTML 开标签属性注入辅助函数
 */
function injectAttrsToHtml(html: string, attrs: string): string {
  if (!html || !attrs || !html.startsWith("<")) return html;

  const gt = html.indexOf(">");
  if (gt === -1) return html;

  const before = html.slice(0, gt);
  const rest = html.slice(gt + 1);
  const beforeTrimmed = before.replace(/\s*$/, "");

  const appendAttrs = (tag: string, extraAttrs: string): string => {
    if (!extraAttrs) return `${tag}>${rest}`;
    if (tag.endsWith("/")) {
      const base = tag.slice(0, -1).replace(/\s*$/, "");
      return `${base} ${extraAttrs} />${rest}`;
    }
    return `${tag} ${extraAttrs}>${rest}`;
  };

  const existingClassMatch = beforeTrimmed.match(/\bclass="([^"]*)"/);
  const injectedClassMatch = attrs.match(/\bclass="([^"]*)"/);

  if (existingClassMatch && injectedClassMatch) {
    const mergedClass = `${existingClassMatch[1]} ${injectedClassMatch[1]}`.trim();
    const tagWithClass = beforeTrimmed.replace(/\bclass="[^"]*"/, `class="${mergedClass}"`);
    const otherAttrs = attrs.replace(/\bclass="[^"]*"\s*/, "").trim();
    return appendAttrs(tagWithClass, otherAttrs);
  }

  return appendAttrs(beforeTrimmed, attrs);
}

/**
 * HTML 属性片段行内解析器。
 *
 * @extends {BaseInlineParser}
 */
class HtmlAttrsInlineParser extends BaseInlineParser {
  constructor() {
    super("html_attrs");
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext) {
    if (src[index] !== "{") return null;
    if (isEscaped(src, index)) return null;

    // 找最近的未转义 '}'
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

    if (close === -1) {
      return {node: createNode("text", 1, "{"), nextIndex: index + 1};
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
        node: createNode("text", close + 1 - index, src.slice(index, close + 1)),
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
  render(node: MarkdownNode, ctx: RenderContext, prevHtmlObj: { html: any; }) {
    const attrs = node.props?.attrs as string | undefined;
    if (!attrs || !prevHtmlObj) return "";

    // 将属性注入到前一个节点的 HTML
    prevHtmlObj.html = injectAttrsToHtml(prevHtmlObj.html, attrs);
    return "";
  }
}

export default new HtmlAttrsInlineParser();