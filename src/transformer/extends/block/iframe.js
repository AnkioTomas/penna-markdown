/**
 * Iframe 嵌入：@@https://example.com
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";

const IFRAME_RE = /^ {0,3}@@\s*(https?:\/\/\S+)/;

/** @param {string} url */
function normalizeIframeUrl(url) {
  return url.trim().replace(/&amp;/g, "&");
}

class IframeBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "iframe", priority: 87 });
  }

  parse(lines, index) {
    const line = lines[index] ?? "";
    const match = line.match(IFRAME_RE);
    if (!match) return null;

    const node = createNode(this.type, {
      src: normalizeIframeUrl(match[1]),
    });
    return { node, nextIndex: index + 1 };
  }

  render(node) {
    const src = escapeHtml(node.props.src ?? "");
    return `<iframe src="${src}" width="100%" height="400px" sandbox="allow-scripts" frameborder="0" loading="lazy" allow="fullscreen"></iframe>`;
  }
}

export default new IframeBlockParser();
