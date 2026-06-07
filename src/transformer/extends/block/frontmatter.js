/**
 * @file 块级语法拓展：YAML Frontmatter
 * @module transformer/extends/block/frontmatter
 *
 * 语法示例：
 * ```
 * ---
 * title: Hello
 * ---
 * ```
 *
 * 仅匹配文档首行；解析结果写入 document.frontMatter，不产生 AST 节点。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { parseFrontmatterYaml } from "@/transformer/extends/utils/frontmatter.js";

/** frontmatter 围栏行：`---` */
const FENCE_RE = /^---(\s|$)/;

/**
 * 判断是否为 frontmatter 围栏行。
 *
 * @param {string} line
 * @returns {boolean}
 */
function isFenceLine(line) {
  return FENCE_RE.test((line ?? "").trimEnd());
}

/**
 * YAML Frontmatter 块解析器。
 *
 * @extends {BaseBlockParser}
 */
class FrontmatterBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "frontmatter", priority: 200, canInterruptParagraph: false });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    if (index !== 0 || !isFenceLine(lines[0])) return null;

    const contentLines = [];
    let i = 1;

    while (i < lines.length) {
      if (isFenceLine(lines[i])) {
        ctx.store.document().frontMatter = parseFrontmatterYaml(
          contentLines.join("\n"),
        );
        return { nextIndex: i + 1 };
      }
      contentLines.push(lines[i]);
      i += 1;
    }

    return null;
  }

  /** @inheritdoc */
  render() {
    return "";
  }
}

/**
 * 文档收尾：将 frontMatter 附加到 root.props。
 *
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode} root
 * @param {import('@/transformer/core/ParserContext.js').BlockParseContext} ctx
 * @returns {import('@/transformer/core/MarkdownNode.js').MarkdownNode}
 */
export function attachFrontmatterToRoot(root, ctx) {
  const frontMatter = ctx.store.document().frontMatter;
  if (frontMatter) {
    root.props = { ...root.props, frontMatter };
  }
  return root;
}

export default new FrontmatterBlockParser();
