/**
 * @file 行内语法：原生 HTML
 * @module transformer/gfm/inline/html
 *
 * 行内 Raw HTML 标签、注释、处理指令等。
 * 🌟 纯字符流状态机，完全抛弃 RegExp，实现极致性能与零内存切片。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";

// --- 纯字符判定辅助函数 ---

const isAlpha = (c: string) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
const isDigit = (c: string) => (c >= '0' && c <= '9');
const isSpace = (c: string) => c === ' ' || c === '\t' || c === '\n' || c === '\r';

// 标签名字符: [A-Za-z0-9-]
const isTagChar = (c: string) => isAlpha(c) || isDigit(c) || c === '-';

// 属性名起始字符: [a-zA-Z_:]
const isAttrNameStart = (c: string) => isAlpha(c) || c === '_' || c === ':';

// 属性名字符: [a-zA-Z0-9_.:-]
const isAttrNameChar = (c: string) => isAttrNameStart(c) || isDigit(c) || c === '.' || c === '-';

// 无引号属性值禁止的字符: [^"'=<>` \t\r\n]
const isUnquotedValid = (c: string) => c && c !== '"' && c !== "'" && c !== '=' && c !== '<' && c !== '>' && c !== '`' && !isSpace(c);

const skipSpaces = (src: string, index: number) => {
  let i = index;
  while (i < src.length && isSpace(src[i])) i++;
  return i;
};

class HTMLInlineParser extends BaseInlineParser {
  constructor() {
    super("html_inline", 150);
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: any) {
    if (src[index] !== '<') return null;

    // 转义检查：判断前置反斜杠的数量
    let backslashCount = 0;
    let i = index - 1;
    while (i >= 0 && src[i] === '\\') {
      backslashCount++;
      i--;
    }
    if (backslashCount % 2 !== 0) return null;

    // 状态机路由分发
    const nextChar = src[index + 1];
    let endIndex = -1;

    if (nextChar === '!') {
      endIndex = this.matchCommentOrDecl(src, index);
    } else if (nextChar === '?') {
      endIndex = this.matchProcessingInstruction(src, index);
    } else if (nextChar === '/') {
      endIndex = this.matchCloseTag(src, index);
    } else if (isAlpha(nextChar)) {
      endIndex = this.matchOpenTag(src, index);
    }

    if (endIndex === -1) return null;

    const matchedStr = src.slice(index, endIndex);
    return {
      node: createNode(this.type, matchedStr.length, matchedStr),
      nextIndex: endIndex,
    };
  }

  // 1. 匹配注释 或 CDATA <![CDATA[...]]> 或 声明 <!DECL>
  private matchCommentOrDecl(src: string, start: number): number {
    // 匹配 CDATA: <![CDATA[
    if (src.startsWith("<![CDATA[", start)) {
      const end = src.indexOf("]]>", start + 9);
      return end !== -1 ? end + 3 : -1;
    }

    // 匹配注释: <!--> / <!--->
    if (src.startsWith("<!-->", start)) return start + 5;
    if (src.startsWith("<!--->", start)) return start + 6;

    // 匹配注释: <!-- ... -->
    if (src.startsWith("<!--", start)) {
      let p = start + 4;
      while (p < src.length) {
        if (src[p] === "-" && src[p + 1] === "-" && src[p + 2] === ">") {
          return p + 3;
        }
        p++;
      }
      return -1;
    }

    // 匹配声明: <![A-Z]...>
    if (
      start + 2 < src.length
      && src[start + 1] === "!"
      && src[start + 2] >= "A"
      && src[start + 2] <= "Z"
    ) {
      const end = src.indexOf(">", start + 3);
      return end !== -1 ? end + 1 : -1;
    }

    return -1;
  }

  // 2. 匹配处理指令: <?...?>
  private matchProcessingInstruction(src: string, start: number): number {
    const end = src.indexOf("?>", start + 2);
    return end !== -1 ? end + 2 : -1;
  }

  // 3. 匹配闭合标签: </tagname\s*>
  private matchCloseTag(src: string, start: number): number {
    let p = start + 2; // 跳过 </
    if (p >= src.length || !isAlpha(src[p])) return -1;

    while (p < src.length && isTagChar(src[p])) p++;

    p = skipSpaces(src, p);

    if (p < src.length && src[p] === ">") return p + 1;
    return -1;
  }

  // 4. 匹配开放标签: <tagname attribute*>
  private matchOpenTag(src: string, start: number): number {
    let p = start + 1; // 跳过 <

    // 扫标签名
    while (p < src.length && isTagChar(src[p])) p++;

    // 扫属性列表
    while (p < src.length) {
      const spaceEnd = skipSpaces(src, p);
      if (spaceEnd === p) break; // 如果没有空格隔开，说明要么是 /> 要么是非法字符

      p = spaceEnd;
      if (p >= src.length || src[p] === "/" || src[p] === ">") break;

      // 解析属性名
      if (!isAttrNameStart(src[p])) return -1; // 非法属性起始字符
      p++;
      while (p < src.length && isAttrNameChar(src[p])) p++;

      // 解析属性值 (可选)
      const beforeEq = skipSpaces(src, p);
      if (beforeEq < src.length && src[beforeEq] === "=") {
        p = skipSpaces(src, beforeEq + 1);
        if (p >= src.length) return -1;

        const quote = src[p];
        if (quote === '"' || quote === "'") {
          // 有引号属性值
          p++;
          while (p < src.length && src[p] !== quote) p++;
          if (p >= src.length) return -1;
          p++; // 吞掉结束引号
        } else {
          // 无引号属性值
          const valStart = p;
          while (p < src.length && isUnquotedValid(src[p])) p++;
          if (p === valStart) return -1; // 等号后面必须有内容
        }
      } else {
        p = beforeEq; // 没有等号，说明只有属性名 (boolean attribute)
      }
    }

    p = skipSpaces(src, p);

    // 标签收尾
    if (p < src.length && src[p] === "/") p++;
    if (p < src.length && src[p] === ">") return p + 1;

    return -1;
  }

  /** @inheritdoc */
  render(node: MarkdownNode) {
    return node.value || "";
  }
}

export default new HTMLInlineParser();