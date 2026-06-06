/**
 * 行内语法：原生 HTML (Raw HTML)
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";

const tagname = '[A-Za-z][A-Za-z0-9-]*';
const attribute_name = '[a-zA-Z_:][a-zA-Z0-9_.:-]*';
const attribute_value = '(?:[^"\'=<>` \\t\\r\\n]+|\'[^\']*\'|"[^"]*")';
const attribute = `(?:\\s+${attribute_name}(?:\\s*=\\s*${attribute_value})?)`;
const open_tag = `<${tagname}${attribute}*\\s*/?>`;
const close_tag = `</${tagname}\\s*>`;
const comment = '(?:<!-->|<!--->|<!--(?:(?!-->)[\\s\\S])*-->)';
const processing_instruction = '<\\?.*?\\?>';
const declaration = '<![A-Z].*?>';
const cdata = '<!\\[CDATA\\[.*?\\]\\]>';

const HTML_TAG_RE = new RegExp(`^(?:${open_tag}|${close_tag}|${comment}|${processing_instruction}|${declaration}|${cdata})`, 'i');

class HTMLInlineParser extends BaseInlineParser {
  constructor() {
    // 优先级 150
    super({ type: "html_inline", priority: 150 });
  }

  parse(src, index, ctx) {
    if (src[index] !== '<' || isEscaped(src, index)) return null;

    const match = src.slice(index).match(HTML_TAG_RE);
    if (!match) return null;

    return {
      node: createNode(this.type, { value: match[0] }),
      nextIndex: index + match[0].length,
    };
  }

  render(node) {
    return node.value;
  }
}

export default new HTMLInlineParser();
