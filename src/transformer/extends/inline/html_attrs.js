/**
 * @file 行内 HTML 属性片段语法
 * @module transformer/extends/inline/html_attrs
 *
 * 语法：`{class="x"}` 等 HTML 属性片段。
 *
 * 语义：
 * - `{class="x"}` 解析为 `html_attrs` 节点
 * - 扩展后处理将其折叠到前一个兄弟节点的 `props.htmlAttrs`
 * - 扩展 afterRender 将属性注入该节点渲染出的开标签
 *
 * 例如：`**bold**{class="x"}` -> `<strong class="x">bold</strong>`
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";

/**
 * 跳过 index 起的连续空白字符。
 *
 * @param {string} str
 * @param {number} i
 * @returns {number} 跳过空白后的新索引
 */
function skipSpaces(str, i) {
  while (i < str.length && /\s/.test(str[i])) i += 1;
  return i;
}

/**
 * 判断字符是否为 XML/HTML 属性名起始字符。
 *
 * @param {string} ch
 * @returns {boolean}
 */
function isNameStart(ch) {
  return /[A-Za-z_:]/.test(ch);
}

/**
 * 判断字符是否为 XML/HTML 属性名后续字符。
 *
 * @param {string} ch
 * @returns {boolean}
 */
function isNameChar(ch) {
  return /[A-Za-z0-9_:-]/.test(ch);
}

/**
 * 将 `{...}` 内部解析为 HTML 属性字符串（已做 value 转义）。
 *
 * 支持：
 * - 简化语法：`.class` → `class="class"`；`#id` → `id="id"`
 * - `key`（布尔属性）
 * - `key="value"` / `key='value'`
 * - `key=value`（不含空白的 value）
 *
 * @param {string} inner - 花括号内的原始字符串
 * @returns {string} 属性字符串，如 `class="x" data-a="1"`；解析失败返回空字符串
 */
function parseAttrsString(inner) {
  const str = String(inner);
  let i = 0;
  const out = [];

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

      if (!value) return "";

      if (prefix === ".") {
        out.push(`class="${escapeHtml(value)}"`);
      } else {
        out.push(`id="${escapeHtml(value)}"`);
      }
      continue;
    }

    const keyStart = i;
    if (!isNameStart(str[i])) return "";
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
    if (i >= str.length) return "";

    let value = "";
    const quote = str[i] === '"' || str[i] === "'" ? str[i] : "";
    if (quote) {
      i += 1; // skip quote
      while (i < str.length) {
        const ch = str[i];
        if (ch === "\\") {
          // 保留常见转义（\" \' \\），其余退化为字面字符
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
      if (i >= str.length || str[i] !== quote) return "";
      i += 1; // skip closing quote
    } else {
      const vStart = i;
      while (i < str.length && !/\s/.test(str[i])) i += 1;
      value = str.slice(vStart, i);
    }

    out.push(`${key}="${escapeHtml(value)}"`);
  }

  return out.join(" ");
}

/**
 * HTML 属性片段行内解析器。
 *
 * @extends {BaseInlineParser}
 */
class HtmlAttrsInlineParser extends BaseInlineParser {
  constructor() {
    // priority 不要太高：让代码 span / 其它关键语法先匹配
    super({ type: "html_attrs", priority: 30 });
  }

  /** @inheritdoc */
  parse(src, index) {
    if (src[index] !== "{") return null;
    if (isEscaped(src, index)) return null;

    // 找最近的未转义 '}'，不支持嵌套
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
      return { node: createNode("text", { value: "{" }), nextIndex: index + 1 };
    }

    const rawInner = src.slice(index + 1, close);
    const inner = rawInner.trim();
    if (!inner) {
      return {
        node: createNode("text", { value: `{${rawInner}}` }),
        nextIndex: close + 1,
      };
    }

    const attrsString = parseAttrsString(inner);
    if (!attrsString) {
      // 解析失败：降级为普通文本，避免把用户写错的语法静默吞掉
      return {
        node: createNode("text", { value: src.slice(index, close + 1) }),
        nextIndex: close + 1,
      };
    }

    return {
      node: createNode(this.type, { attrs: attrsString }),
      nextIndex: close + 1,
    };
  }

  /** @inheritdoc */
  render() {
    // 折叠后不应出现在最终 AST；若残留则输出空
    return "";
  }
}

export default new HtmlAttrsInlineParser();
