/**
 * @file GFM Autolink 行内语法
 * @module transformer/gfm/inline/autolinks
 *
 * 尖括号 `<uri>` / `<email>` autolink（CommonMark / GFM 标准形式）。
 * 🌟 纯游标字符流状态机，抛弃冗长的邮箱/协议正则表达式，零切片、极速验证。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import {InlineParseContext} from "@/transformer/core/context/InlineParseContext";

// --- 纯字符判定辅助函数 (内联优化) ---

const isAlpha = (c: string) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
const isAlnum = (c: string) => isAlpha(c) || (c >= '0' && c <= '9');

// URI 合法字符判定
const isUriChar = (c: string) => {
  const code = c.charCodeAt(0);
  if (code < 0x20 || code === 0x7f) return false;
  return c !== '<' && c !== '>' && c !== ' ' && c !== '\t' && c !== '\n' && c !== '\r';
};

// 邮箱 Local-part 字符判定 (a-z, 0-9, .!#$%&'*+/=?^_`{|}~-)
const isEmailLocalChar = (c: string) => {
  if (isAlnum(c)) return true;
  return ".!#$%&'*+/=?^_`{|}~-".includes(c);
};

// 原生百分号编码（等效于原版 TextEncoder 但更原生高效）
const encodeHref = (src: string, start: number, end: number): string => {
  let out = "";
  for (let i = start; i < end; i++) {
    const ch = src[i];
    if (isUriChar(ch) && !'"<>{}|\\^`[]'.includes(ch)) {
      out += ch;
    } else {
      out += encodeURI(ch);
    }
  }
  return out;
};

// 剥离转移符（如果解析失败，作为普通尖括号文本呈现）
const literalBracketInner = (src: string, start: number, end: number): string => {
  let out = "";
  for (let i = start; i < end; i++) {
    if (src[i] === '\\' && i + 1 < end) {
      out += src[i + 1];
      i++;
    } else {
      out += src[i];
    }
  }
  return `<${out}>`;
};

/**
 * 尖括号 autolink 行内解析器。
 * @extends {BaseInlineParser}
 */
class AutolinksInlineParser extends BaseInlineParser {
  constructor() {
    super("autolink");
  }

  canOpenAt(src: string, index: number, ctx: InlineParseContext): boolean {
    return src[index] === "<";
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: any) {

    // 1. 预读寻找闭合尖括号 `>`
    let close = -1;
    let hasWhitespace = false;
    for (let i = index + 1; i < src.length; i++) {
      const c = src[i];
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
        hasWhitespace = true;
      }
      if (c === '>') {
        close = i;
        break;
      }
    }

    if (close === -1) {
      return { node: createNode("text", 1, "<"), nextIndex: index + 1 };
    }

    const totalLength = close + 1 - index;

    if (close === index + 1) {
      return { node: createNode("text", totalLength, "<>"), nextIndex: close + 1 };
    }

    // Autolink 内部不允许有空白符
    if (hasWhitespace) {
      return {
        node: createNode("text", totalLength, literalBracketInner(src, index + 1, close)),
        nextIndex: close + 1,
      };
    }

    // 2. 验证 Email (不分配字符串，直接指针滑动)
    if (this.isValidEmail(src, index + 1, close)) {
      const label = src.slice(index + 1, close);
      return {
        node: createNode(this.type, totalLength, undefined, undefined, {
          url: `mailto:${label}`,
          label: label,
        }),
        nextIndex: close + 1,
      };
    }

    // 3. 验证 URI (不分配字符串，直接指针滑动)
    if (this.isValidUri(src, index + 1, close)) {
      const label = src.slice(index + 1, close);
      return {
        node: createNode(this.type, totalLength, undefined, undefined, {
          url: encodeHref(src, index + 1, close),
          label: label,
        }),
        nextIndex: close + 1,
      };
    }

    // 4. 解析失败的降级处理
    // GFM 边缘情况：如果 /> 闭合时不是 autolink，交给普通转义处理
    if (src[close - 1] === '\\') {
      return { node: createNode("text", 1, "<"), nextIndex: index + 1 };
    }

    return {
      node: createNode("text", totalLength, literalBracketInner(src, index + 1, close)),
      nextIndex: close + 1,
    };
  }

  /**
   * 原生取代 EMAIL_RE 验证
   */
  private isValidEmail(src: string, start: number, end: number): boolean {
    let atIndex = -1;
    for (let i = start; i < end; i++) {
      if (src[i] === '\\') return false; // Email 不能包含反斜杠转义
      if (src[i] === '@') {
        if (atIndex !== -1) return false; // 只能有一个 @
        atIndex = i;
      }
    }

    if (atIndex === -1 || atIndex === start || atIndex === end - 1) return false;

    // 检查 Local-part
    for (let i = start; i < atIndex; i++) {
      if (!isEmailLocalChar(src[i])) return false;
    }

    // 检查 Domain-part
    if (!isAlnum(src[end - 1])) return false; // 必须以字母或数字结尾

    let labelStart = atIndex + 1;
    while (labelStart < end) {
      let labelEnd = labelStart;
      while (labelEnd < end && src[labelEnd] !== '.') {
        labelEnd++;
      }

      const labelLen = labelEnd - labelStart;
      if (labelLen < 1 || labelLen > 63) return false; // 每段标签 1-63 字符
      if (!isAlnum(src[labelStart])) return false; // 首字符必须是字母/数字
      if (!isAlnum(src[labelEnd - 1])) return false; // 尾字符必须是字母/数字

      // 中间字符只能是字母、数字或连字符 '-'
      for (let i = labelStart + 1; i < labelEnd - 1; i++) {
        const c = src[i];
        if (!isAlnum(c) && c !== '-') return false;
      }

      labelStart = labelEnd + 1;
    }

    return true;
  }

  /**
   * 原生取代 SCHEME_RE 和内部循环验证
   */
  private isValidUri(src: string, start: number, end: number): boolean {
    let colonIndex = -1;
    for (let i = start; i < end; i++) {
      if (src[i] === ':') {
        colonIndex = i;
        break;
      }
    }

    if (colonIndex === -1) return false;

    const schemeLen = colonIndex - start;
    if (schemeLen < 2 || schemeLen > 32) return false; // 协议名长度限制 2-32
    if (!isAlpha(src[start])) return false; // 协议首字母必须为 A-Za-z

    for (let i = start + 1; i < colonIndex; i++) {
      const c = src[i];
      if (!isAlnum(c) && c !== '+' && c !== '-' && c !== '.') return false;
    }

    if (colonIndex + 1 === end) return false; // 冒号后必须有内容

    for (let i = colonIndex + 1; i < end; i++) {
      if (!isUriChar(src[i])) return false; // 剩余部分需均为合法 URI 字符
    }

    return true;
  }

  /** @inheritdoc */
  render(node: MarkdownNode) {
    const url = (node.props?.url as string) || "";
    const label = (node.props?.label as string) || "";
    return `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
  }
}

export default new AutolinksInlineParser();