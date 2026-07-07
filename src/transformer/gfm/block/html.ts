/**
 * @file 块级语法：原生 HTML 块
 * @module transformer/gfm/block/html
 *
 * CommonMark HTML Block Types 1–7。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import { skipBlockPrefixSpaces } from "@/transformer/utils/blockPrefix.js";
import { isBlankString } from "@/transformer/utils/normalize";
import { sanitizeRawHtml } from "@/transformer/utils/safeHtml.js";

// --- 预编译正则：剥离了前导空格检测，只用来精确匹配 HTML 语法 ---
const tagname = "[A-Za-z][A-Za-z0-9-]*";
const attribute_name = "[a-zA-Z_:][a-zA-Z0-9_.:-]*";
const attribute_value = "(?:[^\"'=<>` \\t\\r\\n]+|'[^']*'|\"[^\"]*\")";
const attribute = `(?:\\s+${attribute_name}(?:\\s*=\\s*${attribute_value})?)`;
const open_tag = `<${tagname}${attribute}*\\s*/?>`;
const close_tag = `</${tagname}\\s*>`;

// Type 6 标签列表正则
const TYPE_6_RE =
  /^<\/?(address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h1|h2|h3|h4|h5|h6|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(?:[\s\/>]+|$)/i;
const TYPE_7_RE = new RegExp(`^(?:${open_tag}|${close_tag})\\s*$`, "i");
/**
 * 判断 HTML 块是否闭合
 */
function isHtmlBlockClosed(line: string, type: number): boolean {
  // Types 6 和 7 的闭合条件是遇到空行，不在这里判断
  if (type === 6 || type === 7) return false;

  if (type === 2) return line.includes("-->");
  if (type === 3) return line.includes("?>");
  if (type === 4) return line.includes(">");
  if (type === 5) return line.includes("]]>");

  if (type === 1) {
    const lower = line.toLowerCase();
    return (
      lower.includes("</script>") ||
      lower.includes("</pre>") ||
      lower.includes("</style>") ||
      lower.includes("</textarea>")
    );
  }

  return false;
}
/**
 * 快速探测：判断是否是 HTML 块，并返回其 Type (1-7)
 */
function detectHtmlBlockType(line: string): number | null {
  const i = skipBlockPrefixSpaces(line);
  if (i >= line.length || line[i] !== "<") return null;

  const rest = line.slice(i);

  // Type 1: <script, <pre, <style, <textarea
  if (/^<(?:script|pre|style|textarea)(?:\s|>|$)/i.test(rest)) return 1;

  // Type 2: <!--
  if (rest.startsWith("<!--")) return 2;

  // Type 3: <?
  if (rest.startsWith("<?")) return 3;

  // Type 4: <! + uppercase letter
  if (/^<![A-Z]/.test(rest)) return 4;

  // Type 5: <![CDATA[
  if (rest.startsWith("<![CDATA[")) return 5;

  // Type 6: <address, <article, ...
  if (TYPE_6_RE.test(rest)) return 6;

  // Type 7: open/close tag (cannot interrupt paragraph, checked in canOpenAt)
  if (TYPE_7_RE.test(rest)) return 7;

  return null;
}

/**
 * 块级 HTML 解析器。
 * * 极速快筛、隔离正则，并处理了段落打断边界。
 * @extends {BaseBlockParser}
 */
class HTMLBlockParser extends BaseBlockParser {
  constructor() {
    super("html_block");
  }

  /** @inheritdoc */
  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    const line = lines[index] ?? "";
    const type = detectHtmlBlockType(line);

    if (!type) return false;

    // Type 7 不能打断段落（须前有空行，CommonMark §4.6）
    if (type === 7) {
      if (index > 0 && !isBlankString(lines[index - 1] ?? "")) {
        return false;
      }
    }

    return true;
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    if (!this.canOpenAt(lines, index, ctx)) return null;

    const type = detectHtmlBlockType(lines[index]) as number;
    const contentLines: string[] = [];
    let i = index;

    while (i < lines.length) {
      const currentLine = lines[i];

      // --- Types 6 & 7 闭合判断 ---
      // 遇到空行结束（注意：空行本身不包含在 HTML 块内，所以在此处 break）
      if ((type === 6 || type === 7) && isBlankString(currentLine)) {
        break;
      }

      contentLines.push(currentLine);
      i++;

      // --- Types 1-5 闭合判断 ---
      // 遇到闭合标签结束（注意：闭合标签所在的整行都被包含在 HTML 块内，所以先 push 再 break）
      if (type >= 1 && type <= 5 && isHtmlBlockClosed(currentLine, type)) {
        break;
      }
    }

    const node = createNode("html_block", i - index, undefined, [], {
      value: contentLines.join("\n"),
    });

    return { node, nextIndex: i };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext) {
    const html = sanitizeRawHtml((node.props?.value as string) || "");

    return html.replace(
      /^<([a-zA-Z][\w-]*)/,
      `<$1${this.sourceLineAttrs(node)}`,
    );
  }
}

export default new HTMLBlockParser();
