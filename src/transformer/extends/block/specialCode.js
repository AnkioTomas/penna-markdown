/**
 * Cherry 扩展代码块：echarts / math / katex / latex
 * priority > GFM code，非特殊语言交还标准 code parser
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import codeParser from "@/transformer/gfm/block/code.js";
import { unescapeHref, decodeHtmlEntities } from "@/transformer/gfm/inline/shared.js";
import { renderMathBlock, renderEchartsBlock } from "@/transformer/extends/utils/cherryApi.js";

const SPECIAL_LANGS = new Set(["echarts", "math", "katex", "latex"]);

function parseFenceLang(line) {
  const match = line.match(/^( {0,3})((`{3,})([^`]*)|(~{3,})(.*))$/);
  if (!match) return null;
  const info = (match[4] || match[6] || "").trim();
  return decodeHtmlEntities(unescapeHref(info.split(/\s+/)[0])).toLowerCase();
}

class SpecialCodeBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "code", priority: 105 });
  }

  parse(lines, index, ctx) {
    const lang = parseFenceLang(lines[index] ?? "");
    if (!lang || !SPECIAL_LANGS.has(lang)) {
      return codeParser.parse(lines, index, ctx);
    }
    return codeParser.parse(lines, index, ctx);
  }

  render(node) {
    const lang = (node.props.lang ?? "").toLowerCase();
    const content = node.props.content ?? "";

    if (lang === "echarts") return renderEchartsBlock(content);
    if (lang === "math" || lang === "katex" || lang === "latex") {
      return renderMathBlock(content);
    }
    return codeParser.render(node);
  }
}

export default new SpecialCodeBlockParser();
