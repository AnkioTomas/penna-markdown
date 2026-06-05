/**
 * 行内语法：链接 (Links)
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";

class LinkInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "link", priority: 200 });
  }

  parse(src, index, ctx) {
    if (src[index] !== "[") return null;

    // 寻找匹配的 ]，处理嵌套和转义
    let level = 1;
    let i = index + 1;
    let labelEnd = -1;
    while (i < src.length) {
      if (src[i] === "\\") {
        i += 2;
        continue;
      }
      if (src[i] === "[") level++;
      else if (src[i] === "]") level--;

      if (level === 0) {
        labelEnd = i;
        break;
      }
      i++;
    }

    if (labelEnd === -1) return null;

    const label = src.slice(index + 1, labelEnd);
    let nextIndex = labelEnd + 1;

    // 1. Inline Link: [text](uri "title")
    if (src[nextIndex] === "(") {
        let j = nextIndex + 1;
        while (j < src.length && /[ \t\r\n\v\f]/.test(src[j])) j++;

        let href = "";
        let destEnd = -1;
        if (src[j] === "<") {
            let k = j + 1;
            while (k < src.length) {
                if (src[k] === "\\") k += 2;
                else if (src[k] === ">") { destEnd = k; break; }
                else if (src[k] === "\n") break;
                else k++;
            }
            if (destEnd !== -1) {
                href = src.slice(j + 1, destEnd);
                j = destEnd + 1;
            }
        } else {
            let k = j;
            let pLevel = 0;
            while (k < src.length) {
                const char = src[k];
                if (char === '\\') {
                    k += 2;
                    continue;
                }
                if (char === '(') {
                    pLevel++;
                } else if (char === ')') {
                    if (pLevel === 0) break;
                    pLevel--;
                } else if (/[ \t\r\n\v\f]/.test(char)) {
                    break;
                }
                k++;
            }
            href = src.slice(j, k);
            j = k;
            destEnd = k;
        }

        if (destEnd !== -1) {
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
                    }
                    else k++;
                }
            }

            while (j < src.length && /[ \t\r\n\v\f]/.test(src[j])) j++;

            if (src[j] === ")") {
                const node = createNode("link", {
                    href: this.normalizeHref(href),
                    title: title,
                    children: ctx.parseInline(label)
                });
                return { node, nextIndex: j + 1 };
            }
        }
    }

    return null;
  }

  normalizeHref(href) {
    href = href.replace(/\\(.)/g, '$1');
    return href.replace(/ /g, '%20');
  }

  render(node, ctx) {
    const { href, title } = node.props;
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return `<a href="${escapeHtml(href)}"${titleAttr}>${ctx.renderInline(node.children)}</a>`;
  }
}

export default new LinkInlineParser();
