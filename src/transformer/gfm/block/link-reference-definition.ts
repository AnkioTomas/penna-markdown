/**
 * @file 块级语法：链接引用定义 (Link Reference Definition)
 * @module transformer/gfm/block/linkReferenceDefinition
 *
 * 语法：`[label]: url "title"`
 * 解析结果仅存入 ctx.store，不生成可见的 AST 节点。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import {isBlankString} from "@/transformer/utils/normalize";

/**
 * 规范化 reference label (全小写，合并连续空白)
 */
export function normalizeRefLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * 核心：纯游标无正则解析 LRD 字符串。
 * @returns 解析结果，以及成功消耗的字符数
 */
function parseLRDString(text: string): { consumedCharIndex: number, id: string, href: string, title: string } | null {
  let i = 0;

  // 1. 前导缩进 (0-3 个空格)
  let spaces = 0;
  while (i < text.length && text[i] === ' ' && spaces < 3) { spaces++; i++; }
  if (i >= text.length || text[i] !== '[') return null;

  // 2. 提取 Label
  i++; // 跳过 '['
  let label = "";
  let foundBracket = false;
  while (i < text.length) {
    if (text[i] === '\\' && i + 1 < text.length) {
      label += text[i] + text[i + 1];
      i += 2; continue;
    }
    if (text[i] === '[') return null; // 标签内不能有未转义的 [
    if (text[i] === ']') { foundBracket = true; i++; break; }
    label += text[i];
    i++;
    if (label.length > 999) return null; // 规范：不能超过 999 字符
  }

  if (!foundBracket) return null;
  const id = normalizeRefLabel(label);
  if (id === "") return null; // 标签必须包含非空白字符

  // 3. 必须紧跟冒号
  if (i >= text.length || text[i] !== ':') return null;
  i++;

  // 4. 跳过空白符 (允许最多一个换行符)
  const skipWhitespace = (allowNewline: boolean) => {
    let newlineCount = 0;
    while (i < text.length) {
      if (text[i] === ' ' || text[i] === '\t') { i++; }
      else if (text[i] === '\n') {
        if (!allowNewline || newlineCount > 0) break;
        newlineCount++; i++;
      }
      else if (text[i] === '\r') { i++; }
      else { break; }
    }
  };
  skipWhitespace(true);

  if (i >= text.length) return null;

  // 5. 提取 Destination (href)
  let href = "";
  if (text[i] === '<') {
    i++;
    while (i < text.length && text[i] !== '>') {
      if (text[i] === '\\' && i + 1 < text.length) {
        href += text[i + 1]; i += 2; continue;
      }
      if (text[i] === '<' || text[i] === '\n') return null;
      href += text[i];
      i++;
    }
    if (i >= text.length || text[i] !== '>') return null;
    i++; // 跳过 '>'
  } else {
    let parenCount = 0;
    while (i < text.length && text[i] !== ' ' && text[i] !== '\t' && text[i] !== '\n' && text[i] !== '\r') {
      if (text[i] === '\\' && i + 1 < text.length) {
        href += text[i + 1]; i += 2; continue;
      }
      if (text[i] === '(') parenCount++;
      if (text[i] === ')') {
        if (parenCount === 0) break;
        parenCount--;
      }
      href += text[i];
      i++;
    }
  }

  if (href === "") return null; // href 不能为空

  // 记录一下此时的游标位置，因为 Title 是可选的
  let afterDestIndex = i;

  // 6. 提取 Title (可选)
  let title = "";
  skipWhitespace(true);

  if (i < text.length && (text[i] === '"' || text[i] === "'" || text[i] === '(')) {
    const opener = text[i];
    const closer = opener === '(' ? ')' : opener;
    i++;

    let tempTitle = "";
    let closed = false;
    while (i < text.length) {
      if (text[i] === '\\' && i + 1 < text.length) {
        tempTitle += text[i + 1];
        i += 2;
        continue;
      }
      if (text[i] === closer) {
        closed = true;
        i++;
        break;
      }
      tempTitle += text[i];
      i++;
    }

    if (closed) {
      // Title 后面只能跟着空白符或到达行尾
      let j = i;
      while (j < text.length && (text[j] === ' ' || text[j] === '\t')) j++;
      if (j >= text.length || text[j] === '\n' || text[j] === '\r') {
        title = tempTitle;
        afterDestIndex = j; // 如果 Title 合法，游标更新为包含 Title 的长度
      }
    }
  }

  return { consumedCharIndex: afterDestIndex, id, href, title };
}

/**
 * 链接引用定义块解析器。
 * 纯粹的提取动作，零副作用，零节点输出。
 * @extends {BaseBlockParser}
 */
class LinkReferenceDefinitionParser extends BaseBlockParser {
  constructor() {
    super("linkReferenceDef", 2000);
  }

  /** @inheritdoc */
  canOpenAt(lines: string[], index: number): boolean {
    const line = lines[index] ?? "";
    let spaces = 0;
    while (spaces < line.length && line[spaces] === ' ' && spaces < 3) spaces++;
    return line[spaces] === '[';
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    if (!this.canOpenAt(lines, index)) return null;

    // LRD 中间不能有空行。为了方便游标解析跨行文本，我们提取直到空行前的所有行
    const chunkLines: string[] = [];
    let endIdx = index;
    while (endIdx < lines.length && !isBlankString(lines[endIdx])) {
      chunkLines.push(lines[endIdx]);
      endIdx++;
    }

    const textChunk = chunkLines.join('\n');
    const result = parseLRDString(textChunk);

    if (!result) return null;

    // 精妙的换行行数统计：
    // 我们只需要数一下成功消耗的字符串里包含几个 '\n'，就知道吃了多少行！
    const consumedText = textChunk.slice(0, result.consumedCharIndex);
    let lineCount = 1;
    for (let char of consumedText) {
      if (char === '\n') lineCount++;
    }

    // 核心业务：写入 ctx.store，给后续的 Inline 解析器使用
    // 注意：按照规范，如果遇到同名 ID 的定义，第一个生效，后面的丢弃。
    const key = "ref_" + result.id;

    if (!ctx.store.has(key)) {
      ctx.store.set(key,result);
    }

    // 返回 node 为 null，表示这段文本被消耗了，但不要在 AST 树里占位置
    return { node: null, nextIndex: index + lineCount };
  }

  /** @inheritdoc */
  render() {
    return ""; // 永远不会被渲染
  }
}

export default new LinkReferenceDefinitionParser();