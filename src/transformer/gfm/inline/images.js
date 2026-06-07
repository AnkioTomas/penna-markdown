/**
 * 行内语法：图片 (Images)
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { lookupLinkReference } from "@/transformer/gfm/block/link-reference-definition.js";
import {
  findLinkTextEnd,
  normalizeLinkDestination,
  normalizeLinkTitle,
  parseAngleDestination,
  parsePlainDestination,
} from "@/transformer/gfm/inline/shared.js";

class ImageInlineParser extends BaseInlineParser {
  constructor() {
    // 优先级高于链接
    super({ type: "image", priority: 201 });
  }

  parse(src, index, ctx) {
    if (src[index] !== "!" || src[index + 1] !== "[") return null;

    const startIndex = index + 1;
    const labelEnd = findLinkTextEnd(src, startIndex + 1);
    if (labelEnd === -1) return null;

    const label = src.slice(startIndex + 1, labelEnd);
    let nextIndex = labelEnd + 1;

    // 1. Inline image: ![alt](uri "title")
    if (src[nextIndex] === "(") {
      const inline = this.parseInlineDestination(src, nextIndex, label, ctx);
      if (inline) return { node: inline.node, nextIndex: inline.nextIndex };
    }

    // 2. Full / collapsed reference: ![alt][ref] / ![alt][]
    if (src[nextIndex] === "[") {
      const refEnd = findLinkTextEnd(src, nextIndex + 1);
      if (refEnd !== -1) {
        const refLabel = src.slice(nextIndex + 1, refEnd);
        const refId = refLabel.length > 0 ? refLabel : label;
        const end = refEnd + 1;
        return {
          node: createNode("image", {
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

    // 3. Shortcut reference: ![alt]
    if (src[nextIndex] !== "(" && src[nextIndex] !== "[") {
      const end = labelEnd + 1;
      return {
        node: createNode("image", {
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

  parseInlineDestination(src, start, label, ctx) {
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
      node: createNode("image", {
        href: normalizeLinkDestination(href),
        title: normalizeLinkTitle(title),
        children: ctx.parseInline(label),
      }),
      nextIndex: j + 1,
    };
  }

  render(node, ctx) {
    const alt = this.renderAlt(node.children);

    if (node.props.reference) {
      const def = lookupLinkReference(ctx.store, node.props.ref);
      if (!def) {
        return escapeHtml(node.props.fallback ?? "");
      }
      const href = normalizeLinkDestination(def.href);
      const title = def.title ?? "";
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(alt)}"${titleAttr} />`;
    }

    const { href, title } = node.props;
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return `<img src="${escapeHtml(href)}" alt="${escapeHtml(alt)}"${titleAttr} />`;
  }

  renderAlt(nodes) {
    return nodes
      .map((n) => {
        if (n.type === "text") return n.value;
        if (n.children) return this.renderAlt(n.children);
        return "";
      })
      .join("");
  }
}

export default new ImageInlineParser();
