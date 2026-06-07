/**
 * Cherry 扩展代码块：echarts / math / mermaid / card 等
 * priority > GFM code，非特殊语言交还标准 code parser
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import codeParser from "@/transformer/gfm/block/code.js";
import { unescapeHref, decodeHtmlEntities } from "@/transformer/gfm/inline/shared.js";
import {
  renderMathBlock,
  renderEchartsBlock,
  renderMermaidBlock,
} from "@/transformer/extends/utils/cherryApi.js";
import { renderCardBlock } from "@/transformer/extends/utils/cherryCard.js";

const SPECIAL_RENDERERS = {
  echarts: renderEchartsBlock,
  math: renderMathBlock,
  katex: renderMathBlock,
  latex: renderMathBlock,
  mermaid: renderMermaidBlock,
  graph: renderMermaidBlock,
  card: renderCardBlock,
};

const SPECIAL_LANGS = new Set(Object.keys(SPECIAL_RENDERERS));

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
    const render = SPECIAL_RENDERERS[lang];
    if (render) return render(content);
    return codeParser.render(node);
  }
}

export default new SpecialCodeBlockParser();
