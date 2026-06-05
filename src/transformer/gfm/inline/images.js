/**
 * 行内语法：图片 (Images)
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";

class ImageInlineParser extends BaseInlineParser {
  constructor() {
    // 优先级高于链接
    super({ type: "image", priority: 201 });
  }

  parse(src, index, ctx) {
    if (src[index] !== '!' || src[index + 1] !== '[') return null;
    
    const startIndex = index + 1;

    let i = startIndex + 1;
    let labelEnd = -1;
    while(i < src.length) {
      // Allow escaped brackets
      if (src[i] === ']' && src[i-1] !== '\\') {
        labelEnd = i;
        break;
      }
      i++;
    }
    if (labelEnd === -1) return null;

    const label = src.slice(startIndex + 1, labelEnd);
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
                const node = createNode("image", {
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
    const alt = this.renderAlt(node.children);
    return `<img src="${escapeHtml(href)}" alt="${escapeHtml(alt)}"${titleAttr} />`;
  }

  renderAlt(nodes) {
    return nodes.map(n => {
        if (n.type === "text") return n.value;
        if (n.children) return this.renderAlt(n.children);
        return "";
    }).join("");
  }
}

export default new ImageInlineParser();
