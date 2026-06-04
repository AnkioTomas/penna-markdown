/**
 * GFM 尖括号 Autolink：<uri> 与 <email>
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";

const SCHEME_RE = /^[A-Za-z][A-Za-z0-9+.-]{1,31}$/;
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function isUriChar(ch) {
  const c = ch.charCodeAt(0);
  if (c < 0x20 || c === 0x7f) return false;
  return ch !== "<" && ch !== ">" && ch !== " " && ch !== "\t" && ch !== "\n" && ch !== "\r";
}

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

function parseEmailAutolink(inner) {
  if (!inner.includes("@") || inner.includes("\\")) return null;
  if (!EMAIL_RE.test(inner)) return null;
  return {
    url: `mailto:${inner}`,
    label: inner,
  };
}

/** 非 autolink 的尖括号内容：反斜杠转义不生效，但显示时去掉 `\` */
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

class AutolinksInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "autolink", priority: 90 });
  }

  parse(src, index) {
    if (src[index] !== "<") return null;

    const close = src.indexOf(">", index + 1);
    if (close === -1) return null;

    const inner = src.slice(index + 1, close);
    if (inner.length === 0) return null;

    for (const ch of inner) {
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") return null;
    }

    const link = parseEmailAutolink(inner) ?? parseUriAutolink(inner);
    if (!link) {
      return {
        node: createNode("text", { value: `<${literalBracketInner(inner)}>` }),
        nextIndex: close + 1,
      };
    }

    return {
      node: createNode(this.type, {
         url: link.url, label: link.label ,
      }),
      nextIndex: close + 1,
    };
  }

  render(node,renderInline)  {
    const { url, label } = node.props ?? {};
    return `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
  }
}

export default new AutolinksInlineParser();
