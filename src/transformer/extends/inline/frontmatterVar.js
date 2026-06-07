/**
 * @file Frontmatter 变量引用语法
 * @module transformer/extends/inline/frontmatterVar
 *
 * 语法：`[[name]]` / `[[nested.key]]`，从文档 front matter 解析并内联替换变量值。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";
import {
  FRONTMATTER_VAR_RE,
  formatFrontmatterValue,
  resolveFrontmatterVar,
} from "@/transformer/extends/utils/frontmatter.js";

/**
 * Frontmatter 变量引用行内解析器。
 *
 * @extends {BaseInlineParser}
 */
class FrontmatterVarInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "frontmatter_var", priority: 210 });
  }

  /** @inheritdoc */
  parse(src, index, ctx) {
    if (src[index] !== "[" || src[index + 1] !== "[") return null;
    if (isEscaped(src, index)) return null;

    const match = src.slice(index).match(FRONTMATTER_VAR_RE);
    if (!match) return null;

    const varName = match[1];
    const vars = ctx.store.document().frontMatter;
    const value = resolveFrontmatterVar(vars, varName);
    const formatted = formatFrontmatterValue(value);

    return {
      node: createNode(this.type, {
        varName,
        raw: match[0],
        resolved: formatted !== null,
        value: formatted ?? match[0],
      }),
      nextIndex: index + match[0].length,
    };
  }

  /** @inheritdoc */
  render(node) {
    const { varName, resolved, value } = node.props;
    const text = escapeHtml(value);
    if (!resolved) return text;
    return `<span class="frontmatter-var" data-type="frontmatter" data-var="${escapeHtml(varName)}">${text}</span>`;
  }
}

export default new FrontmatterVarInlineParser();
