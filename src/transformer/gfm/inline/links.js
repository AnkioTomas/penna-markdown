/**
 * 行内语法：链接 (Links)
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { lookupLinkReference } from "@/transformer/gfm/block/link-reference-definition.js";
import {
  containsNestedLinkOrImage,
  findLinkTextEnd,
  parseAngleDestination,
  parsePlainDestination,
  unescapeHref,
} from "@/transformer/gfm/inline/shared.js";

class LinkInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "link", priority: 200 });
  }

  parse(src, index, ctx) {
    if (src[index] !== "[") return null;

    const labelEnd = findLinkTextEnd(src, index + 1);
    if (labelEnd === -1) return null;

    const label = src.slice(index + 1, labelEnd);
    const nextIndex = labelEnd + 1;

    const children = ctx.parseInline(label);

    if (containsNestedLinkOrImage(children)) return null;

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
      const refEnd = findLinkTextEnd(src, nextIndex + 1);
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
      const def = lookupLinkReference(ctx.store, label);
      if (!def) return null;
      return {
        node: this.createReferenceNode(label, children, src.slice(index, labelEnd + 1)),
        nextIndex: labelEnd + 1,
      };
    }

    return null;
  }

  createReferenceNode(ref, children, fallback, referenceKind = "shortcut") {
    return createNode("link", {
      reference: true,
      ref,
      referenceKind,
      fallback,
      children,
    });
  }

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
        href: this.normalizeHref(href),
        title: unescapeHref(title),
        children,
      }),
      nextIndex: j + 1,
    };
  }

  normalizeHref(href) {
    return encodeURI(unescapeHref(href));
  }

  render(node, ctx) {
    const inner = ctx.renderInline(node.children);

    if (node.props.reference) {
      const def = lookupLinkReference(ctx.store, node.props.ref);
      if (!def) {
        return escapeHtml(node.props.fallback ?? "");
      }
      const href = this.normalizeHref(def.href);
      const title = def.title ?? "";
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      return `<a href="${escapeHtml(href)}"${titleAttr}>${inner}</a>`;
    }

    const { href, title } = node.props;
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return `<a href="${escapeHtml(href)}"${titleAttr}>${inner}</a>`;
  }
}

export default new LinkInlineParser();
