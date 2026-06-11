/**
 * @file GFM Autolink 行内语法
 * @module transformer/gfm/inline/autolinks
 *
 * 尖括号 `<uri>` / `<email>` autolink（CommonMark / GFM 标准形式）。
 * 不含 GFM 扩展的无尖括号自动链接（www. / 裸 URL / 裸邮箱）。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";

/** URI scheme 名称正则 */
const SCHEME_RE = /^[A-Za-z][A-Za-z0-9+.-]{1,31}$/;

/** 尖括号 email autolink 内容校验 */
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * 判断字符是否可出现在 URI 中。
 *
 * @param {string} ch
 * @returns {boolean}
 */
function isUriChar(ch) {
  const c = ch.charCodeAt(0);
  if (c < 0x20 || c === 0x7f) return false;
  return ch !== "<" && ch !== ">" && ch !== " " && ch !== "\t" && ch !== "\n" && ch !== "\r";
}

/**
 * 对 URI 做百分号编码（保留安全字符）。
 *
 * @param {string} uri
 * @returns {string}
 */
function encodeHref(uri) {
  let out = "";
  for (let i = 0; i < uri.length; i += 1) {
    const ch = uri[i];
    if (isUriChar(ch) && !'"<>{}|\\^`[]'.includes(ch)) {
      out += ch;
    } else {
      const bytes = new TextEncoder().encode(ch);
      for (const b of bytes) {
        out += `%${b.toString(16).toUpperCase().padStart(2, "0")}`;
      }
    }
  }
  return out;
}

/**
 * 渲染 autolink 节点为 `<a>` 标签。
 *
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode} node
 * @returns {string}
 */
function renderAutolink(node) {
  const { url, label } = node;
  return `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
}

/**
 * 解析尖括号 email autolink 内容。
 *
 * @param {string} inner
 * @returns {{ url: string, label: string } | null}
 */
function parseBracketEmailAutolink(inner) {
  if (!inner.includes("@") || inner.includes("\\")) return null;
  if (!EMAIL_RE.test(inner)) return null;
  return {
    url: `mailto:${inner}`,
    label: inner,
  };
}

/**
 * 非 autolink 的尖括号内容：反斜杠转义不生效，但显示时去掉 `\`。
 *
 * @param {string} inner
 * @returns {string}
 */
function literalBracketInner(inner) {
  let out = "";
  for (let i = 0; i < inner.length; i += 1) {
    if (inner[i] === "\\" && i + 1 < inner.length) {
      out += inner[i + 1];
      i += 1;
    } else {
      out += inner[i];
    }
  }
  return out;
}

/**
 * 解析尖括号 URI autolink 内容。
 *
 * @param {string} inner
 * @returns {{ url: string, label: string } | null}
 */
function parseUriAutolink(inner) {
  const colon = inner.indexOf(":");
  if (colon < 2) return null;

  const scheme = inner.slice(0, colon);
  if (!SCHEME_RE.test(scheme)) return null;

  const rest = inner.slice(colon + 1);
  if (rest.length === 0) return null;
  for (const ch of rest) {
    if (!isUriChar(ch)) return null;
  }

  return {
    url: encodeHref(inner),
    label: inner,
  };
}

/**
 * 尖括号 autolink 行内解析器。
 *
 * @extends {BaseInlineParser}
 */
class AutolinksInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "autolink", priority: 90 });
  }

  /** @inheritdoc */
  parse(src, index) {
    if (src[index] !== "<") return null;

    const close = src.indexOf(">", index + 1);
    if (close === -1) {
      return {
        node: createNode("text", { value: "<", bracketLiteral: true }),
        nextIndex: index + 1,
      };
    }

    const inner = src.slice(index + 1, close);
    if (inner.length === 0) {
      return {
        node: createNode("text", { value: "<>", bracketLiteral: true }),
        nextIndex: close + 1,
      };
    }

    for (const ch of inner) {
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
        return {
          node: createNode("text", {
            value: `<${literalBracketInner(inner)}>`,
            bracketLiteral: true,
          }),
          nextIndex: close + 1,
        };
      }
    }

    const link = parseBracketEmailAutolink(inner) ?? parseUriAutolink(inner);
    if (!link) {
      // `\>` 闭合时不是 autolink（Example 502），交给普通转义处理
      if (close > index + 1 && src[close - 1] === "\\") {
        return {
          node: createNode("text", { value: "<", bracketLiteral: true }),
          nextIndex: index + 1,
        };
      }
      return {
        node: createNode("text", {
          value: `<${literalBracketInner(inner)}>`,
          bracketLiteral: true,
        }),
        nextIndex: close + 1,
      };
    }

    return {
      node: createNode(this.type, {
        url: link.url,
        label: link.label,
      }),
      nextIndex: close + 1,
    };
  }

  /** @inheritdoc */
  render(node) {
    return renderAutolink(node);
  }
}

export default new AutolinksInlineParser();
