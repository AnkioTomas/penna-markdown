/**
 * 块级语法：链接引用定义 (Link Reference Definitions)
 */
import { BaseBlockParser } from "@/transformer/core/ParserBase.js";

const DEF_LINE_RE =
  /^[ \t]*\[((?:\\.|[^\[\]])+)\]:[ \t]*(\S+)(?:[ \t]+(["'(](?:\\.|[^"'()])+["')])?)?[ \t]*$/;

class LinkReferenceDefinitionParser extends BaseBlockParser {
  constructor() {
    super({ type: "linkReferenceDef", priority: 190 });
  }

  parse(lines, index, ctx) {
    const line = lines[index] ?? "";
    const match = line.match(DEF_LINE_RE);
    if (!match) return null;

    const id = match[1].toLowerCase().replace(/\s+/g, " ");
    const href = (match[2] || "").replace(/\\(.)/g, "$1");
    let title = match[3] || "";
    if (title) {
      title = title.substring(1, title.length - 1).replace(/\\(.)/g, "$1");
    }

    const references = ctx.store.get("references") ?? {};
    references[id] = { href, title };
    ctx.store.set("references", references);

    return { node: null, nextIndex: index + 1 };
  }

  render() {
    return "";
  }
}

export default new LinkReferenceDefinitionParser();
