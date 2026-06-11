/**
 * @file 块级语法拓展：Cherry 特殊代码块
 * @module transformer/extends/block/specialCode
 *
 * 在 GFM 代码块基础上，对 echarts / math / mermaid 等语言
 * 使用专用渲染器；priority > GFM code，非特殊语言交还标准 code parser。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import codeParser from "@/transformer/gfm/block/code.js";
import { unescapeHref, decodeHtmlEntities } from "@/transformer/gfm/inline/shared.js";
import {
  renderMathBlock,
  renderEchartsBlock,
  renderMermaidBlock,
} from "@/transformer/extends/utils/cherryApi.js";

/** 语言标识 → 专用渲染函数 */
const SPECIAL_RENDERERS = {
  echarts: renderEchartsBlock,
  math: renderMathBlock,
  katex: renderMathBlock,
  latex: renderMathBlock,
  mermaid: renderMermaidBlock,
  graph: renderMermaidBlock,
};

/** 受 Cherry 接管的围栏语言集合 */
const SPECIAL_LANGS = new Set(Object.keys(SPECIAL_RENDERERS));

/**
 * 从围栏开标记行提取语言标识。
 *
 * @param {string} line
 * @returns {string | null}
 */
function parseFenceLang(line) {
  const match = line.match(/^( {0,3})((`{3,})([^`]*)|(~{3,})(.*))$/);
  if (!match) return null;
  const info = (match[4] || match[6] || "").trim();
  return decodeHtmlEntities(unescapeHref(info.split(/\s+/)[0])).toLowerCase();
}

/**
 * Cherry 特殊代码块解析器（包装 GFM code parser）。
 *
 * @extends {BaseBlockParser}
 */
class SpecialCodeBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "code", priority: 105 });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const result = codeParser.parse(lines, index, ctx);
    if (result) {
      const lang = parseFenceLang(lines[index] ?? "");
      if (lang && SPECIAL_LANGS.has(lang)) {
        result.node.lang = lang;
      }
    }
    return result;
  }

  /** @inheritdoc */
  render(node) {
    const lang = (node.lang ?? "").toLowerCase();
    const content = node.content ?? "";
    const render = SPECIAL_RENDERERS[lang];
    if (render) return render(content);
    return codeParser.render(node);
  }
}

export default new SpecialCodeBlockParser();
