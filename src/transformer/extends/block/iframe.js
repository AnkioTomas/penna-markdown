/**
 * @file 块级语法拓展：Iframe 嵌入
 * @module transformer/extends/block/iframe
 *
 * 语法：`!iframe[标题](https://example.com)`
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import {
  parseIframeSource,
  renderIframeHtml,
} from "@/transformer/extends/media/shared.js";

/** 块级 iframe 行：`!iframe[` */
const IFRAME_LINE_RE = /^ {0,3}!iframe\[/;

/**
 * Iframe 嵌入块解析器。
 *
 * @extends {BaseBlockParser}
 */
class IframeBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "iframe_embed", priority: 87 });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const line = lines[index] ?? "";
    if (!IFRAME_LINE_RE.test(line)) return null;

    const content = line.replace(/^ {0,3}/, "");
    const parsed = parseIframeSource(content, 0, ctx);
    if (!parsed || parsed.nextIndex !== content.length) return null;

    const { href, title, children } = parsed.node;
    const node = createNode("iframe_embed", {
      href,
      title,
      children,
    });

    return { node, nextIndex: index + 1 };
  }

  /** @inheritdoc */
  render(node) {
    return renderIframeHtml(node);
  }
}

export default new IframeBlockParser();
