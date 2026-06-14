/**
 * @file 行内语法：链接
 * @module transformer/gfm/inline/links
 *
 * 行内链接：inline、full/collapsed/shortcut reference 形式。
 * 纯游标与堆栈扫描，移除外部依赖，完全依靠自身 AST 节点流转。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import {InlineParseContext} from "@/transformer/core/context/InlineParseContext";

// --- 辅助工具函数（内联化） ---

const skipWhitespace = (src: string, index: number): number => {
  let i = index;
  while (i < src.length && /^[ \t\n\r\v\f]$/.test(src[i])) i++;
  return i;
};

// 检查是否包含嵌套链接 (GFM 不允许链接内存在链接)
const containsNestedLink = (nodes: MarkdownNode[]): boolean => {
  return nodes.some(
      (node) => node.type === "link" || (node.children && containsNestedLink(node.children))
  );
};

// 规范化引用标签 (统一转小写，合并连续空白)
const normalizeReferenceLabel = (label: string): string => {
  return label.trim().replace(/[ \t\n\r\v\f]+/g, ' ').toLowerCase();
};

class LinkInlineParser extends BaseInlineParser {
  constructor() {
    super("link", 2000);
  }

  canOpenAt(src: string, index: number, ctx: InlineParseContext): boolean {
    return src[index] === "[";
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: any) {

    // 1. 堆栈预读寻找链接文本的闭合括号 ']'
    let j = index + 1;
    let bracketStack = 0; // 用于处理嵌套的 [ ]
    let labelEnd = -1;

    while (j < src.length) {
      if (src[j] === '\\' && j + 1 < src.length) {
        j += 2; // 跳过转义
        continue;
      }

      if (src[j] === '[') {
        bracketStack++;
      } else if (src[j] === ']') {
        if (bracketStack > 0) {
          bracketStack--;
        } else {
          labelEnd = j; // 栈为空时遇到 ']'，即为文本闭合处
          break;
        }
      }
      j++;
    }

    if (labelEnd === -1) return null;

    const labelText = src.slice(index + 1, labelEnd);
    const nextIndex = labelEnd + 1;

    // 递归解析链接内部的子节点
    const children = ctx.parseInline(labelText);

    // GFM 规范：链接内部不能再包含链接
    if (containsNestedLink(children)) return null;

    // 2. 尝试解析 Inline Link: [text](uri "title")
    if (nextIndex < src.length && src[nextIndex] === "(") {
      const inlineResult = this.parseInlineLink(src, nextIndex, index, children);
      if (inlineResult) return inlineResult;

      // 规范降级：如果 `(...)` 格式不合法，尝试作为 Shortcut reference 处理
      const def = this.lookupReference(ctx, labelText);
      if (def) {
        return this.createResolvedLinkNode(index, nextIndex, def.href, def.title, children);
      }
      return null;
    }

    // 3. 尝试解析 Full / Collapsed reference: [text][ref] 或 [text][]
    if (nextIndex < src.length && src[nextIndex] === "[") {
      let k = nextIndex + 1;
      let refLabelEnd = -1;

      // 寻找引用的闭合 ']'，引用标签内不允许嵌套未转义的 '['
      while (k < src.length) {
        if (src[k] === '\\') { k += 2; continue; }
        if (src[k] === ']') { refLabelEnd = k; break; }
        if (src[k] === '[') break; // GFM 规定 reference 内部不能有未转义的 [
        k++;
      }

      if (refLabelEnd !== -1) {
        const refLabel = src.slice(nextIndex + 1, refLabelEnd);
        const refId = refLabel.length > 0 ? refLabel : labelText; // Collapsed 降级
        const def = this.lookupReference(ctx, refId);

        if (!def) return null; // 找不到定义，退化为普通文本

        return this.createResolvedLinkNode(index, refLabelEnd + 1, def.href, def.title, children);
      }
    }

    // 4. 尝试解析 Shortcut reference: [text]
    const def = this.lookupReference(ctx, labelText);
    if (def) {
      return this.createResolvedLinkNode(index, nextIndex, def.href, def.title, children);
    }

    return null;
  }

  /**
   * 纯静态解析 Inline 链接的 (href "title") 部分。
   * 引入 parenStack 解决 href 内部的括号嵌套问题。
   */
  private parseInlineLink(src: string, start: number, originalIndex: number, children: MarkdownNode[]) {
    let j = skipWhitespace(src, start + 1);
    let href = "";

    // 解析 href
    if (j < src.length && src[j] === "<") {
      // 尖括号形式 <...>
      const destStart = j + 1;
      while (j < src.length && src[j] !== ">") {
        if (src[j] === '\\') j++;
        j++;
      }
      if (src[j] !== ">") return null;
      href = src.slice(destStart, j).replace(/\\([\\>])/g, '$1'); // 简单去除转义
      j++; // 跳过 '>'
    } else {
      // 裸露形式，需要用栈处理嵌套括号 (e.g. `(http://example.com/a(b)c)`)
      const destStart = j;
      let parenStack = 0;
      while (j < src.length) {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (/^[ \t\n\r\v\f]$/.test(src[j])) break; // 遇到空白结束
        if (src[j] === '(') {
          parenStack++;
        } else if (src[j] === ')') {
          if (parenStack > 0) {
            parenStack--;
          } else {
            break; // 遇到了属于最外围闭合的 ')'
          }
        }
        j++;
      }
      href = src.slice(destStart, j).replace(/\\([\\()])/g, '$1');
    }

    j = skipWhitespace(src, j);

    // 解析 title
    let title = "";
    if (j < src.length && (src[j] === '"' || src[j] === "'" || src[j] === "(")) {
      const closer = src[j] === "(" ? ")" : src[j];
      const titleStart = j + 1;
      let closed = false;
      j++;

      while (j < src.length) {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === closer) {
          title = src.slice(titleStart, j).replace(/\\([\\"'(])/g, '$1');
          closed = true;
          j++;
          break;
        }
        j++;
      }
      if (!closed) return null; // 标题未闭合
    }

    j = skipWhitespace(src, j);

    // 必须以 ')' 完美收尾
    if (j >= src.length || src[j] !== ")") return null;

    return this.createResolvedLinkNode(
        originalIndex,
        j + 1,
        href,
        title,
        children
    );
  }

  /**
   * 去上下文词典里查找引用链接定义
   */
  private lookupReference(ctx: any, label: string) {
    if (!ctx.store) return null;
    const key = normalizeReferenceLabel(label);
    // 这里假设 ctx.store 以键值对形式存储了 reference link 的信息
    // 请根据你实际的 store 结构做轻微调整，如 ctx.store.get(key)
    return ctx.store[key] || typeof ctx.store.getLink === 'function' ? ctx.store.getLink(key) : null;
  }

  /**
   * 统一生成脱水的彻底解析节点
   */
  private createResolvedLinkNode(startIndex: number, endIndex: number, href: string, title: string, children: MarkdownNode[]) {
    return {
      node: createNode("link", endIndex - startIndex, undefined, children, { href, title }),
      nextIndex: endIndex,
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: any) {
    const inner = ctx.renderInline(node.children);
    const href = node.props?.href as string || "";
    const title = node.props?.title as string || "";

    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return `<a href="${escapeHtml(href)}"${titleAttr}>${inner}</a>`;
  }
}

export default new LinkInlineParser();