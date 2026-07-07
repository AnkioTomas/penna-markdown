/**
 * @file Frontmatter 变量引用语法
 * @module transformer/extends/inline/frontmatterVar
 *
 * 语法：`[[name]]` / `[[nested.key]]`，从文档 front matter 解析并内联替换变量值。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import type { InlineParseContext } from "@/transformer/core/context/InlineParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";

/**
 * 行内 frontmatter 变量占位符正则。
 *
 * 匹配 `[[var.path]]` 形式，捕获组 1 为点分路径（仅允许 `\w`、`.`、`-`）。
 */
const FRONTMATTER_VAR_RE = /^\[\[([\w.-]+)\]\]/;

/**
 * 按点分路径从 frontmatter 变量对象中取值。
 */
function resolveFrontmatterVar(
  vars: Record<string, unknown> | null | undefined,
  path: string,
): unknown {
  if (!vars || !path) return undefined;
  let current: unknown = vars;
  for (const key of path.split(".")) {
    if (current == null || typeof current !== "object" || !(key in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * 将 frontmatter 变量值格式化为可插入 HTML 的字符串。
 *
 * - 字符串数组 → 逗号分隔（如 tags）
 * - 纯对象 → JSON（仅用于调试，路径应写到具体字段）
 */
function formatFrontmatterValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) {
    const items = value
      .map((item) => formatFrontmatterValue(item))
      .filter((item): item is string => item !== null && item !== "");
    return items.length > 0 ? items.join(", ") : "";
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

class FrontmatterVarInlineParser extends BaseInlineParser {
  constructor() {
    super("frontmatter_var");
  }

  canOpenAt(src: string, index: number, _ctx: InlineParseContext): boolean {
    return src[index] === "[" && src[index + 1] === "[";
  }

  parse(src: string, index: number, ctx: InlineParseContext) {
    const match = src.slice(index).match(FRONTMATTER_VAR_RE);
    if (!match) return null;

    const varName = match[1];
    return {
      node: createNode(this.type, match[0].length, undefined, undefined, {
        varName,
        raw: match[0],
      }),
      nextIndex: index + match[0].length,
    };
  }

  render(node: MarkdownNode, ctx: RenderContext): string {
    const varName = node.props?.varName as string | undefined;
    if (!varName) return escapeHtml(node.value ?? "");

    const vars = ctx.store.get("frontMatter") as Record<string, unknown> | null;
    const value = resolveFrontmatterVar(vars, varName);
    const formatted = formatFrontmatterValue(value);

    // 变量未定义：保留原始字面量 `[[name]]`，不要吞掉文本
    return escapeHtml(
      formatted ?? (node.props?.raw as string) ?? node.value ?? "",
    );
  }
}

export default new FrontmatterVarInlineParser();
