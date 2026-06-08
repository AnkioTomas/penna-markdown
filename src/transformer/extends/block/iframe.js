/**
 * @file 块级语法拓展：Iframe 嵌入
 * @module transformer/extends/block/iframe
 *
 * 语法示例：
 * ```
 * @@https://example.com
 * ```
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";

/** iframe 标记行：`@@` + URL */
const IFRAME_RE = /^ {0,3}@@\s*(https?:\/\/\S+)/;

/**
 * 规范化 iframe URL（去空白、还原 `&amp;`）。
 *
 * @param {string} url
 * @returns {string}
 */
function normalizeIframeUrl(url) {
  return url.trim().replace(/&amp;/g, "&");
}

/**
 * Iframe 嵌入块解析器。
 *
 * @extends {BaseBlockParser}
 */
class IframeBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "iframe", priority: 87 });
  }

  /** @inheritdoc */
  parse(lines, index) {
    const line = lines[index] ?? "";
    const match = line.match(IFRAME_RE);
    if (!match) return null;

    const node = createNode(this.type, {
      src: normalizeIframeUrl(match[1]),
    });
    return { node, nextIndex: index + 1 };
  }

  /** @inheritdoc */
  render(node) {
    const src = escapeHtml(node.src ?? "");
    return `<iframe src="${src}" width="100%" height="400px" sandbox="allow-scripts" frameborder="0" loading="lazy" allow="fullscreen"></iframe>`;
  }
}

export default new IframeBlockParser();
