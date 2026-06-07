/**
 * YAML Frontmatter：文档开头的 --- ... ---
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { parseFrontmatterYaml } from "@/transformer/extends/utils/frontmatter.js";

const FENCE_RE = /^---(\s|$)/;

function isFenceLine(line) {
  return FENCE_RE.test((line ?? "").trimEnd());
}

class FrontmatterBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "frontmatter", priority: 200, canInterruptParagraph: false });
  }

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

  render() {
    return "";
  }
}

/** @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode} root @param {import('@/transformer/core/ParserContext.js').BlockParseContext} ctx */
export function attachFrontmatterToRoot(root, ctx) {
  const frontMatter = ctx.store.document().frontMatter;
  if (frontMatter) {
    root.props = { ...root.props, frontMatter };
  }
  return root;
}

export default new FrontmatterBlockParser();
