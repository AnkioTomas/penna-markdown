/**
 * 脚注定义块：[^id]: 内容
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { parseFootnoteDefinition } from "@/transformer/extends/utils/footnote.js";

class FootnoteDefBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "footnote_def", priority: 195, canInterruptParagraph: false });
  }

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

  render() {
    return "";
  }
}

export default new FootnoteDefBlockParser();
