/**
 * @file 块级语法拓展：增强围栏代码块
 * @module transformer/extends/block/enhancedCode
 *
 * 在 GFM 代码块基础上支持 title、语言标签与复制按钮；
 * priority > specialCode，非特殊语言输出增强 HTML，特殊语言委托 specialCode。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import codeParser from "@/transformer/gfm/block/code.js";
import specialCodeParser from "@/transformer/extends/block/specialCode.js";
import { parseFenceMeta } from "@/transformer/extends/utils/parseFenceMeta.js";
import { renderEnhancedCodeBlock } from "@/transformer/extends/utils/renderEnhancedCode.js";

/** 与 specialCode 一致的特殊围栏语言 */
const SPECIAL_LANGS = new Set(["echarts", "mermaid", "graph"]);

/**
 * 增强围栏代码块解析器（包装 GFM code parser）。
 *
 * @extends {BaseBlockParser}
 */
class EnhancedCodeBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "code", priority: 110 });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const result = codeParser.parse(lines, index, ctx);
    if (!result) return null;

    const meta = parseFenceMeta(lines[index] ?? "");
    if (meta) {
      if (meta.lang) result.node.lang = meta.lang;
      if (meta.title) result.node.title = meta.title;
      if (meta.highlightLines.length > 0) {
        result.node.highlightLines = meta.highlightLines;
      }
      if (meta.collapsedLines) {
        result.node.collapsedLines = true;
        if (meta.collapsedMaxLines) {
          result.node.collapsedMaxLines = meta.collapsedMaxLines;
        }
      }
    }

    const lang = (result.node.lang ?? "").toLowerCase();
    if (lang && SPECIAL_LANGS.has(lang)) {
      result.node.lang = lang;
    }

    return result;
  }

  /** @inheritdoc */
  render(node) {
    const lang = (node.lang ?? "").toLowerCase();
    if (SPECIAL_LANGS.has(lang)) {
      return specialCodeParser.render(node);
    }
    return renderEnhancedCodeBlock(node);
  }
}

export default new EnhancedCodeBlockParser();
