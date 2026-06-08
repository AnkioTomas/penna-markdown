/**
 * @file 行内语法：链接
 * @module transformer/gfm/inline/links
 *
 * 行内链接：inline、full/collapsed/shortcut reference 形式。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { lookupLinkReference } from "@/transformer/gfm/block/link-reference-definition.js";
import {
  containsNestedLink,
  findLinkLabelEnd,
  findLinkTextEnd,
  normalizeLinkDestination,
  normalizeLinkTitle,
  parseAngleDestination,
  parsePlainDestination,
} from "@/transformer/gfm/inline/shared.js";

/**
 * 链接行内解析器。
 *
 * @extends {BaseInlineParser}
 */
class LinkInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "link", priority: 200 });
  }

  /** @inheritdoc */
  parse(src, index, ctx) {
    if (src[index] !== "[") return null;

    const labelEnd = findLinkTextEnd(src, index + 1);
    if (labelEnd === -1) return null;

    const label = src.slice(index + 1, labelEnd);
    const nextIndex = labelEnd + 1;

    const children = ctx.parseInline(label);

    if (containsNestedLink(children)) return null;

    // 1. Inline Link: [text](uri "title")
    if (src[nextIndex] === "(") {
      const inline = this.parseInlineLink(src, nextIndex, children);
      if (inline) return { node: inline.node, nextIndex: inline.nextIndex };

      const def = lookupLinkReference(ctx.store, label);
      if (def) {
        return {
          node: this.createReferenceNode(label, children, src.slice(index, labelEnd + 1)),
          nextIndex: labelEnd + 1,
        };
      }
      return null;
    }

    // 2. Full / Collapsed reference: [text][ref] / [text][]
    if (src[nextIndex] === "[") {
      const refEnd = findLinkLabelEnd(src, nextIndex + 1);
      if (refEnd !== -1) {
        const refLabel = src.slice(nextIndex + 1, refEnd);
        const refId = refLabel.length > 0 ? refLabel : label;
        const end = refEnd + 1;
        const def = lookupLinkReference(ctx.store, refId);
        if (!def) return null;
        return {
          node: this.createReferenceNode(
            refId,
            children,
            src.slice(index, end),
            refLabel.length > 0 ? "full" : "collapsed",
          ),
          nextIndex: end,
        };
      }
    }

    // 3. Shortcut reference: [text]
    if (src[nextIndex] !== "(" && src[nextIndex] !== "[") {
      const shortcutEnd = findLinkLabelEnd(src, index + 1);
      if (shortcutEnd === -1) return null;
      const shortcutLabel = src.slice(index + 1, shortcutEnd);
      const def = lookupLinkReference(ctx.store, shortcutLabel);
      if (!def) return null;
      return {
        node: this.createReferenceNode(
          shortcutLabel,
          ctx.parseInline(shortcutLabel),
          src.slice(index, shortcutEnd + 1),
        ),
        nextIndex: shortcutEnd + 1,
      };
    }

    return null;
  }

  /**
   * 创建 reference 链接 AST 节点。
   *
   * @param {string} ref
   * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]} children
   * @param {string} fallback
   * @param {'shortcut'|'full'|'collapsed'} [referenceKind='shortcut']
   * @returns {import('@/transformer/core/MarkdownNode.js').MarkdownNode}
   */
  createReferenceNode(ref, children, fallback, referenceKind = "shortcut") {
    return createNode("link", {
      reference: true,
      ref,
      referenceKind,
      fallback,
      children,
    });
  }

  /**
   * 解析 inline link 的 destination 与 title。
   *
   * @param {string} src
   * @param {number} start
   * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]} children
   * @returns {{ node: import('@/transformer/core/MarkdownNode.js').MarkdownNode, nextIndex: number } | null}
   */
  parseInlineLink(src, start, children) {
    let j = start + 1;
    while (j < src.length && /[ \t\r\n\v\f]/.test(src[j])) j++;

    let href = "";
    if (src[j] === "<") {
      const dest = parseAngleDestination(src, j);
      if (!dest) return null;
      href = dest.href;
      j = dest.next;
    } else {
      const dest = parsePlainDestination(src, j);
      href = dest.href;
      j = dest.next;
    }

    while (j < src.length && /[ \t\r\n\v\f]/.test(src[j])) j++;

    let title = "";
    if (src[j] === '"' || src[j] === "'" || src[j] === "(") {
      const closer = src[j] === "(" ? ")" : src[j];
      let k = j + 1;
      while (k < src.length) {
        if (src[k] === "\\") k += 2;
        else if (src[k] === closer) {
          title = src.slice(j + 1, k);
          j = k + 1;
          break;
        } else k++;
      }
    }

    while (j < src.length && /[ \t\r\n\v\f]/.test(src[j])) j++;
    if (src[j] !== ")") return null;

    return {
      node: createNode("link", {
        href: normalizeLinkDestination(href),
        title: normalizeLinkTitle(title),
        children,
      }),
      nextIndex: j + 1,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const inner = ctx.renderInline(node.children);

    if (node.reference) {
      const def = lookupLinkReference(ctx.store, node.ref);
      if (!def) {
        return escapeHtml(node.fallback ?? "");
      }
      const href = normalizeLinkDestination(def.href);
      const title = normalizeLinkTitle(def.title ?? "");
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      return `<a href="${escapeHtml(href)}"${titleAttr}>${inner}</a>`;
    }

    const { href, title } = node;
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return `<a href="${escapeHtml(href)}"${titleAttr}>${inner}</a>`;
  }
}

export default new LinkInlineParser();
