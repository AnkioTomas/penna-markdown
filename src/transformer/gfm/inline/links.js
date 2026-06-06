/**
 * 行内语法：链接 (Links)
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { lookupLinkReference } from "@/transformer/gfm/block/link-reference-definition.js";
import {
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

    const labelEnd = this.findBracketEnd(src, index + 1);
    if (labelEnd === -1) return null;

    const label = src.slice(index + 1, labelEnd);
    let nextIndex = labelEnd + 1;

    // 1. Inline Link: [text](uri "title")
    if (src[nextIndex] === "(") {
      const inline = this.parseInlineLink(src, nextIndex, label, ctx);
      if (inline) return { node: inline.node, nextIndex: inline.nextIndex };
    }

    // 2. Full / Collapsed reference: [text][ref] / [text][]
    if (src[nextIndex] === "[") {
      const refEnd = this.findBracketEnd(src, nextIndex + 1);
      if (refEnd !== -1) {
        const refLabel = src.slice(nextIndex + 1, refEnd);
        const refId = refLabel.length > 0 ? refLabel : label;
        const end = refEnd + 1;
        return {
          node: createNode("link", {
            reference: true,
            ref: refId,
            referenceKind: refLabel.length > 0 ? "full" : "collapsed",
            fallback: src.slice(index, end),
            children: ctx.parseInline(label),
          }),
          nextIndex: end,
        };
      }
    }

    // 3. Shortcut reference: [text]
    if (src[nextIndex] !== "(" && src[nextIndex] !== "[") {
      const end = labelEnd + 1;
      return {
        node: createNode("link", {
          reference: true,
          ref: label,
          referenceKind: "shortcut",
          fallback: src.slice(index, end),
          children: ctx.parseInline(label),
        }),
        nextIndex: end,
      };
    }

    return null;
  }

  parseInlineLink(src, start, label, ctx) {
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
        title,
        children: ctx.parseInline(label),
      }),
      nextIndex: j + 1,
    };
  }

  findBracketEnd(src, start) {
    let level = 1;
    let i = start;
    while (i < src.length) {
      if (src[i] === "\\") {
        i += 2;
        continue;
      }
      if (src[i] === "[") level++;
      else if (src[i] === "]") {
        level--;
        if (level === 0) return i;
      }
      i++;
    }
    return -1;
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
