/**
 * @file GFM Autolink 行内语法
 * @module transformer/gfm/inline/autolinks
 *
 * 尖括号 `<uri>` / `<email>` autolink 与 GFM 扩展 autolink（www. / URL / 邮箱）。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { escapeAngleBrackets, escapeHtml } from "@/transformer/utils/escape.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";

/** URI scheme 名称正则 */
const SCHEME_RE = /^[A-Za-z][A-Za-z0-9+.-]{1,31}$/;

/** 尖括号 email autolink 内容校验 */
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/** 扩展 autolink 允许的安全 URL scheme 前缀 */
const URL_SCHEMES = ["http://", "https://", "ftp://"];

/** 扩展 autolink 尾部可剥离的标点 */
const TRAILING_PUNCT = new Set("?!.,:*_~'\"");

/** 邮箱 local part 允许的额外字符 */
const LOCAL_EXTRA = ".+-_";

/**
 * 判断字符是否为字母或数字。
 *
 * @param {string} ch
 * @returns {boolean}
 */
function isAlnum(ch) {
  return /[A-Za-z0-9]/.test(ch);
}

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
 * 判断字符是否可出现在 host 中。
 *
 * @param {string} ch
 * @returns {boolean}
 */
function isValidHostChar(ch) {
  if (/\s/.test(ch)) return false;
  return isAlnum(ch);
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
  const { url, label } = node.props ?? {};
  return `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
}

/**
 * 扩展 autolink 是否可在 index 处开始。
 *
 * @param {string} src
 * @param {number} index
 * @returns {boolean}
 */
function canStartUriAutolink(src, index) {
  if (index === 0) return true;
  const prev = src[index - 1];
  return /\s/.test(prev) || "*_~(".includes(prev);
}

/**
 * 校验域名部分长度与下划线规则。
 *
 * @param {string} data
 * @param {boolean} allowShort
 * @returns {number}
 */
function checkDomain(data, allowShort) {
  let np = 0;
  let uscore1 = 0;
  let uscore2 = 0;
  let i = 1;

  for (; i < data.length - 1; i += 1) {
    if (data[i] === "\\" && i < data.length - 2) {
      i += 1;
      continue;
    }
    if (data[i] === "_") {
      uscore2 += 1;
    } else if (data[i] === ".") {
      uscore1 = uscore2;
      uscore2 = 0;
      np += 1;
    } else if (!isValidHostChar(data[i]) && data[i] !== "-") {
      break;
    }
  }

  if (uscore1 > 0 || uscore2 > 0) {
    if (np <= 10) return 0;
  }

  if (allowShort) return i;
  return np > 0 ? i : 0;
}

/**
 * 确定扩展 autolink 的有效结束位置（处理括号平衡与尾部标点）。
 *
 * @param {string} data
 * @returns {number}
 */
function autolinkDelim(data) {
  let linkEnd = data.length;

  let opening = 0;
  let closing = 0;
  for (let i = 0; i < linkEnd; i += 1) {
    const c = data[i];
    if (c === "<") {
      linkEnd = i;
      break;
    }
    if (c === "(") opening += 1;
    else if (c === ")") closing += 1;
  }

  while (linkEnd > 0) {
    const c = data[linkEnd - 1];
    if (c === ")") {
      if (closing <= opening) return linkEnd;
      closing -= 1;
      linkEnd -= 1;
      continue;
    }
    if (TRAILING_PUNCT.has(c)) {
      linkEnd -= 1;
      continue;
    }
    if (c === ";") {
      let newEnd = linkEnd - 2;
      while (newEnd > 0 && isAlnum(data[newEnd])) newEnd -= 1;
      if (newEnd < linkEnd - 2 && data[newEnd] === "&") {
        linkEnd = newEnd;
      } else {
        linkEnd -= 1;
      }
      continue;
    }
    return linkEnd;
  }

  return linkEnd;
}

/**
 * 判断 URL scheme 前缀是否安全。
 *
 * @param {string} prefix
 * @returns {boolean}
 */
function isSafeUrlScheme(prefix) {
  return URL_SCHEMES.some(
    (scheme) => prefix.startsWith(scheme) && isValidHostChar(prefix[scheme.length] ?? ""),
  );
}

// --- 尖括号 autolink ---

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

/**
 * 解析 `www.` 开头的扩展 autolink。
 *
 * @param {string} src
 * @param {number} index
 * @returns {{ url: string, label: string, nextIndex: number } | null}
 */
function parseWwwAutolink(src, index) {
  if (!canStartUriAutolink(src, index)) return null;
  if (!src.startsWith("www.", index)) return null;

  const rest = src.slice(index);
  let linkEnd = checkDomain(rest, false);
  if (linkEnd === 0) return null;

  while (linkEnd < rest.length && !/\s/.test(rest[linkEnd]) && rest[linkEnd] !== "<") {
    linkEnd += 1;
  }

  linkEnd = autolinkDelim(rest.slice(0, linkEnd));
  if (linkEnd === 0) return null;

  const label = rest.slice(0, linkEnd);
  return {
    url: `http://${label}`,
    label,
    nextIndex: index + linkEnd,
  };
}

/**
 * 解析 `http://` 等 scheme 开头的扩展 autolink。
 *
 * @param {string} src
 * @param {number} index
 * @returns {{ url: string, label: string, nextIndex: number } | null}
 */
function parseUrlAutolink(src, index) {
  let schemeStart = index;
  let matchedScheme = "";

  for (const scheme of URL_SCHEMES) {
    if (src.startsWith(scheme, index)) {
      matchedScheme = scheme;
      break;
    }
  }

  if (!matchedScheme) {
    if (src[index] !== ":" || src[index + 1] !== "/" || src[index + 2] !== "/") {
      return null;
    }
    let rewind = 0;
    while (index - rewind - 1 >= 0 && /[A-Za-z]/.test(src[index - rewind - 1])) {
      rewind += 1;
    }
    schemeStart = index - rewind;
    const candidate = src.slice(schemeStart);
    matchedScheme = URL_SCHEMES.find((s) => candidate.startsWith(s)) ?? "";
    if (!matchedScheme || !isSafeUrlScheme(candidate)) return null;
  } else if (!canStartUriAutolink(src, schemeStart)) {
    return null;
  }

  const rest = src.slice(schemeStart);
  let linkEnd = matchedScheme.length;
  const domainLen = checkDomain(rest.slice(linkEnd), true);
  if (domainLen === 0) return null;

  linkEnd += domainLen;
  while (linkEnd < rest.length && !/\s/.test(rest[linkEnd]) && rest[linkEnd] !== "<") {
    linkEnd += 1;
  }

  linkEnd = autolinkDelim(rest.slice(0, linkEnd));
  if (linkEnd === 0) return null;

  const label = rest.slice(0, linkEnd);
  return {
    url: label,
    label,
    nextIndex: schemeStart + linkEnd,
  };
}

/**
 * 校验 `@` 前是否为 `mailto:` 协议前缀。
 *
 * @param {string} src
 * @param {number} atIndex
 * @param {number} rewind
 * @param {number} maxRewind
 * @returns {boolean}
 */
function validateMailtoProtocol(src, atIndex, rewind, maxRewind) {
  const protocol = "mailto:";
  if (protocol.length > maxRewind - rewind) return false;
  const start = atIndex - rewind - protocol.length;
  if (start < 0 || !src.startsWith(protocol, start)) return false;
  if (start === 0) return true;
  return !isAlnum(src[start - 1]);
}

/**
 * 解析无尖括号的扩展 email autolink。
 *
 * @param {string} src
 * @param {number} index
 * @returns {{ url: string, label: string, nextIndex: number } | null}
 */
function parseExtendedEmailAutolink(src, index) {
  const atPos = src.indexOf("@", index);
  if (atPos < 0) return null;

  const maxRewind = atPos - index;
  if (maxRewind === 0) return null;

  let rewind = 0;
  let autoMailto = true;

  for (; rewind < maxRewind; rewind += 1) {
    const c = src[atPos - 1 - rewind];
    if (isAlnum(c)) continue;
    if (LOCAL_EXTRA.includes(c)) continue;
    if (c === ":" && validateMailtoProtocol(src, atPos, rewind, maxRewind)) {
      autoMailto = false;
      continue;
    }
    break;
  }

  if (rewind === 0 || atPos - rewind !== index) return null;

  let linkEnd = 1;
  let np = 0;

  for (; atPos + linkEnd < src.length; linkEnd += 1) {
    const c = src[atPos + linkEnd];
    if (isAlnum(c)) continue;
    if (c === "@") return null;
    if (c === "." && atPos + linkEnd < src.length - 1 && isAlnum(src[atPos + linkEnd + 1])) {
      np += 1;
      continue;
    }
    if (c !== "-" && c !== "_") break;
  }

  const last = src[atPos + linkEnd - 1];
  if (linkEnd < 2 || np !== 1 || (!isAlnum(last) && last !== ".")) {
    return null;
  }

  const fromAt = src.slice(atPos, atPos + linkEnd);
  linkEnd = autolinkDelim(fromAt);
  if (linkEnd === 0) return null;

  const label = src.slice(index, atPos + linkEnd);
  const url = autoMailto ? `mailto:${label}` : label;

  return {
    url,
    label,
    nextIndex: index + label.length,
  };
}

/**
 * GFM 扩展 autolink 行内解析器（www / URL / email，无尖括号）。
 *
 * @extends {BaseInlineParser}
 */
class AutolinkExtInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "autolink_ext", priority: 85 });
  }

  /** @inheritdoc */
  parse(src, index) {
    const email = parseExtendedEmailAutolink(src, index);
    if (email) {
      return {
        node: createNode(this.type, { url: email.url, label: email.label }),
        nextIndex: email.nextIndex,
      };
    }

    const www = parseWwwAutolink(src, index);
    if (www) {
      return {
        node: createNode(this.type, { url: www.url, label: www.label }),
        nextIndex: www.nextIndex,
      };
    }

    const url = parseUrlAutolink(src, index);
    if (url) {
      return {
        node: createNode(this.type, { url: url.url, label: url.label }),
        nextIndex: url.nextIndex,
      };
    }

    return null;
  }

  /** @inheritdoc */
  render(node) {
    return renderAutolink(node);
  }
}

export default new AutolinksInlineParser();
/** GFM 扩展 autolink 解析器单例 */
export const autolinkExt = new AutolinkExtInlineParser();
