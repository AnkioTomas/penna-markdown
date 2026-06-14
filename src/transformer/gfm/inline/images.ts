/**
 * @file 行内语法：图片
 * @module transformer/gfm/inline/images
 *
 * 行内图片：inline、full/collapsed/shortcut reference 形式。
 * 🌟 纯游标与堆栈扫描，移除外部依赖。
 * 🌟 AST 净化：解析阶段彻底决议链接地址，拒绝向 AST 注入脏数据。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";

// --- 辅助工具函数（内联化） ---

const skipWhitespace = (src: string, index: number): number => {
  let i = index;
  while (i < src.length && /^[ \t\n\r\v\f]$/.test(src[i])) i++;
  return i;
};

// 规范化引用标签 (统一转小写，合并连续空白)
const normalizeReferenceLabel = (label: string): string => {
  return label.trim().replace(/[ \t\n\r\v\f]+/g, ' ').toLowerCase();
};

class ImageInlineParser extends BaseInlineParser {
  constructor() {
    // 优先级 201，必须高于普通链接 (200)，以优先截获 `![`
    super("image", 201);
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: any) {
    if (src[index] !== "!" || src[index + 1] !== "[") return null;

    // 1. 堆栈预读寻找图片 alt 文本的闭合括号 ']'
    let j = index + 2;
    let bracketStack = 0;
    let labelEnd = -1;

    while (j < src.length) {
      if (src[j] === '\\' && j + 1 < src.length) {
        j += 2;
        continue;
      }

      if (src[j] === '[') {
        bracketStack++;
      } else if (src[j] === ']') {
        if (bracketStack > 0) {
          bracketStack--;
        } else {
          labelEnd = j; // 栈为空遇到 ']'，alt 文本闭合
          break;
        }
      }
      j++;
    }

    if (labelEnd === -1) return null;

    const labelText = src.slice(index + 2, labelEnd);
    const nextIndex = labelEnd + 1;

    // 递归解析 alt 内部可能存在的加粗斜体等子节点
    const children = ctx.parseInline(labelText);

    // 2. 尝试解析 Inline Image: ![alt](uri "title")
    if (nextIndex < src.length && src[nextIndex] === "(") {
      const inlineResult = this.parseInlineImage(src, nextIndex, index, children);
      if (inlineResult) return inlineResult;

      // 规范降级：`(...)` 格式不合法，尝试作为 Shortcut reference 处理
      const def = this.lookupReference(ctx, labelText);
      if (def) {
        return this.createResolvedImageNode(index, nextIndex, def.href, def.title, children);
      }
      return null;
    }

    // 3. 尝试解析 Full / Collapsed reference: ![alt][ref] 或 ![alt][]
    if (nextIndex < src.length && src[nextIndex] === "[") {
      let k = nextIndex + 1;
      let refLabelEnd = -1;

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

        if (!def) return null; // 未定义则解析失败

        return this.createResolvedImageNode(index, refLabelEnd + 1, def.href, def.title, children);
      }
    }

    // 4. 尝试解析 Shortcut reference: ![alt]
    const def = this.lookupReference(ctx, labelText);
    if (def) {
      return this.createResolvedImageNode(index, nextIndex, def.href, def.title, children);
    }

    // 如果所有尝试都失败，返回 null。
    // 引擎会完美地将当前的 `!` 当作普通文本消耗掉，然后把后面的 `[` 交给 Link 解析器！
    return null;
  }

  /**
   * 纯游标与堆栈解析 Inline 图片的 (href "title") 部分。
   */
  private parseInlineImage(src: string, start: number, originalIndex: number, children: MarkdownNode[]) {
    let j = skipWhitespace(src, start + 1);
    let href = "";

    // 解析 href
    if (j < src.length && src[j] === "<") {
      const destStart = j + 1;
      while (j < src.length && src[j] !== ">") {
        if (src[j] === '\\') j++;
        j++;
      }
      if (src[j] !== ">") return null;
      href = src.slice(destStart, j).replace(/\\([\\>])/g, '$1');
      j++; // 跳过 '>'
    } else {
      const destStart = j;
      let parenStack = 0;
      while (j < src.length) {
        if (src[j] === '\\') { j += 2; continue; }
        if (/^[ \t\n\r\v\f]$/.test(src[j])) break;
        if (src[j] === '(') parenStack++;
        else if (src[j] === ')') {
          if (parenStack > 0) parenStack--;
          else break;
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
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === closer) {
          title = src.slice(titleStart, j).replace(/\\([\\"'(])/g, '$1');
          closed = true;
          j++;
          break;
        }
        j++;
      }
      if (!closed) return null;
    }

    j = skipWhitespace(src, j);

    if (j >= src.length || src[j] !== ")") return null;

    return this.createResolvedImageNode(
        originalIndex,
        j + 1,
        href,
        title,
        children
    );
  }

  /**
   * 上下文查找图片引用
   */
  private lookupReference(ctx: any, label: string) {
    if (!ctx.store) return null;
    const key = normalizeReferenceLabel(label);
    return ctx.store[key] || (typeof ctx.store.getLink === 'function' ? ctx.store.getLink(key) : null);
  }

  /**
   * 创建确定的 Image 节点
   */
  private createResolvedImageNode(startIndex: number, endIndex: number, href: string, title: string, children: MarkdownNode[]) {
    return {
      node: createNode("image", endIndex - startIndex, undefined, children, { href, title }),
      nextIndex: endIndex,
    };
  }

  /**
   * 递归剥离所有 HTML / 格式标签，仅提取纯文本作为 alt 属性
   */
  private renderAlt(nodes: MarkdownNode[]): string {
    return nodes
        .map((n) => {
          if (n.type === "text") return n.value || "";
          if (n.children) return this.renderAlt(n.children);
          return "";
        })
        .join("");
  }

  /** @inheritdoc */
  render(node: MarkdownNode) {
    const alt = this.renderAlt(node.children || []);
    const href = (node.props?.href as string) || "";
    const title = (node.props?.title as string) || "";

    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return `<img src="${escapeHtml(href)}" alt="${escapeHtml(alt)}"${titleAttr} />`;
  }
}

export default new ImageInlineParser();