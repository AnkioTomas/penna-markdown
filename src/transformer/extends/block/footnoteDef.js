/**
 * @file 块级语法拓展：脚注定义
 * @module transformer/extends/block/footnoteDef
 *
 * 语法示例：
 * ```
 * [^id]: 脚注内容
 * ```
 *
 * 解析时将定义写入 document.footnoteDefinitions，不产生 AST 节点。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { parseFootnoteDefinition } from "@/transformer/extends/utils/footnote.js";

/**
 * 脚注定义块解析器。
 *
 * @extends {BaseBlockParser}
 */
class FootnoteDefBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "footnote_def", priority: 195, canInterruptParagraph: false });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const def = parseFootnoteDefinition(lines, index);
    if (!def) return null;

    const doc = ctx.store.document();
    if (!doc.footnoteDefinitions) doc.footnoteDefinitions = {};
    if (!doc.footnoteDefinitions[def.id]) {
      doc.footnoteDefinitions[def.id] = { lines: def.lines };
    }

    return { nextIndex: def.nextIndex };
  }

  /** @inheritdoc */
  render() {
    return "";
  }
}

export default new FootnoteDefBlockParser();
