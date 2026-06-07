/**
 * 块级语法：原生 HTML 块 (HTML Blocks)
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";

const tagname = '[A-Za-z][A-Za-z0-9-]*';
const attribute_name = '[a-zA-Z_:][a-zA-Z0-9_.:-]*';
const attribute_value = '(?:[^"\'=<>` \\t\\r\\n]+|\'[^\']*\'|"[^"]*")';
const attribute = `(?:\\s+${attribute_name}(?:\\s*=\\s*${attribute_value})?)`;
const open_tag = `<${tagname}${attribute}*\\s*/?>`;
const close_tag = `</${tagname}\\s*>`;

const HTML_BLOCK_OPEN = [
  // Type 1: script, pre, style, textarea
  [/^ {0,3}<(script|pre|style|textarea)(?:\s|>|$)/i, /<\/(script|pre|style|textarea)>/i],
  // Type 2: <!--
  [/^ {0,3}<!--/, /-->/],
  // Type 3: <?
  [/^ {0,3}<\?/, /\?>/],
  // Type 4: <! + letter
  [/^ {0,3}<![A-Z]/, />/],
  // Type 5: <![CDATA[
  [/^ {0,3}<!\[CDATA\[/, /\]\]>/],
  // Type 6: tags like address, article, etc.
  [/^ {0,3}<\/?(address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h1|h2|h3|h4|h5|h6|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(?:\s|\/?>|$)/i, null],
];

const TYPE_7_RE = new RegExp(`^ {0,3}(?:${open_tag}|${close_tag})\\s*$`, 'i');

class HTMLBlockParser extends BaseBlockParser {
  constructor() {
    // 优先级 120：高于 Heading (98) 和 Code (100)
    super({ type: "html_block", priority: 120 });
    this.canInterruptParagraph = true;
  }

  parse(lines, index, ctx) {
    const line = lines[index] ?? "";

    let type = -1;
    let closer = null;

    for (let i = 0; i < HTML_BLOCK_OPEN.length; i++) {
      const [opener, cls] = HTML_BLOCK_OPEN[i];
      if (opener.test(line)) {
        type = i + 1;
        closer = cls;
        break;
      }
    }

    if (type === -1) {
      if (TYPE_7_RE.test(line)) {
        // Type 7 cannot interrupt a paragraph
        if (ctx.prevNodes === undefined) {
          // Interrupt check
          return null;
        }
        if (ctx.prevNodes.length > 0 && ctx.prevNodes[ctx.prevNodes.length - 1].type === "paragraph") {
          return null;
        }
        type = 7;
      }
    }

    if (type === -1) return null;

    const contentLines = [line];
    let i = index + 1;

    if (closer) {
      // Types 1-5
      if (!closer.test(line)) {
        while (i < lines.length) {
          contentLines.push(lines[i]);
          if (closer.test(lines[i])) {
            i++;
            break;
          }
          i++;
        }
      }
    } else {
      // Types 6 and 7 end with a blank line
      while (i < lines.length) {
        if (lines[i].trim() === "") {
          break;
        }
        contentLines.push(lines[i]);
        i++;
      }
    }

    return {
      node: createNode(this.type, { value: contentLines.join("\n") }),
      nextIndex: i,
    };
  }

  render(node) {
    return node.value;
  }
}

export default new HTMLBlockParser();
