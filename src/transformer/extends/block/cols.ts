/**
 * @file 块级语法拓展：列布局
 * @module transformer/extends/block/cols
 *
 * 语法示例：
 * ```
 * ::: cols gap=24px
 * @col max-width=200px
 * 左列内容
 * @col
 * 右列内容（未标宽度 → flex:1 自动均分）
 * :::
 * ```
 *
 * 只新增“列”一个原语：上下堆叠（行）= markdown 默认流，hr 语义不变。
 * 列内容可再嵌 `::: cols`，靠 `:::` 深度平衡递归解析，无歧义。
 * 纯 CSS flex，无 JavaScript。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import {
  createNode,
  type MarkdownNode,
} from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import {
  blockLength,
  readTripleColonBlock,
} from "@/transformer/extends/block/card/shared.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";

/** 列布局开标记行：`::: cols [属性]` */
const OPEN_RE = /^ {0,3}:::(?!:)\s+cols\b(.*)$/;

/** 三冒号闭标记行 */
const CLOSE_RE = /^ {0,3}:::\s*$/;

/** 嵌套三冒号开标记（排除四冒号块） */
const NESTED_OPEN_RE = /^ {0,3}:::(?!:)\s+\S/;

/** 列分隔标记行：`@col [属性]` */
const COL_HEAD_RE = /^@col\b(.*)$/;

/** 单个属性键值对：key=value（value 可带引号） */
const ATTR_RE = /([\w-]+)=("[^"]*"|'[^']*'|\S+)/g;

/** 列级允许的 CSS 属性 */
const COL_KEYS = new Set([
  "width",
  "min-width",
  "max-width",
  "flex",
  "flex-basis",
  "flex-grow",
  "flex-shrink",
  "align-self",
  "order",
]);

/** 容器级允许的 CSS 属性 */
const CONTAINER_KEYS = new Set([
  "gap",
  "align-items",
  "justify-content",
  "flex-wrap",
]);

/** 值中出现即判定为不安全（防注入） */
const UNSAFE_VALUE_RE = /[;{}<>]|url\(|expression/i;

/**
 * 把 `key=value` 片段解析为受白名单约束的内联 style 字符串。
 * 非白名单键、含注入字符的值一律丢弃。
 */
function parseStyleAttrs(raw: string, allowed: Set<string>): string {
  const decls: string[] = [];
  for (const match of String(raw ?? "").matchAll(ATTR_RE)) {
    const key = match[1].toLowerCase();
    if (!allowed.has(key)) continue;

    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    value = value.trim();
    if (!value || UNSAFE_VALUE_RE.test(value)) continue;

    decls.push(`${key}:${value}`);
  }
  return decls.join(";");
}

/** style 属性片段（已转义），无内容返回空串 */
function styleAttr(style: string): string {
  return style ? ` style="${escapeHtml(style)}"` : "";
}

interface ColSection {
  style: string;
  contentLines: string[];
}

/**
 * 按 `@col` 切分列。**只在 `:::` 深度为 0 时切**，
 * 使嵌套 `::: cols` 内部的 `@col` 归属内层，不被外层切走。
 * 首个 `@col` 之前的内容丢弃（与 tabs 一致）。
 */
function splitColumns(lines: string[]): ColSection[] {
  const sections: ColSection[] = [];
  let current: ColSection | null = null;
  let depth = 0;

  for (const line of lines) {
    if (depth === 0) {
      const head = line.match(COL_HEAD_RE);
      if (head) {
        current = {
          style: parseStyleAttrs(head[1], COL_KEYS),
          contentLines: [],
        };
        sections.push(current);
        continue;
      }
    }

    if (NESTED_OPEN_RE.test(line)) {
      depth += 1;
    } else if (CLOSE_RE.test(line) && depth > 0) {
      depth -= 1;
    }

    if (current) current.contentLines.push(line);
  }

  return sections;
}

class ColsBlockParser extends BaseBlockParser {
  constructor() {
    super("cols");
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return OPEN_RE.test(lines[index] ?? "");
  }

  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const block = readTripleColonBlock(lines, index, OPEN_RE);
    if (!block) return null;

    const sections = splitColumns(normalizeInnerLines(block.innerLines));
    if (sections.length === 0) return null;

    const containerStyle = parseStyleAttrs(block.attrs, CONTAINER_KEYS);
    const columns = sections.map((section) => {
      const children = ctx.parseBlocks(
        normalizeInnerLines(section.contentLines),
      );
      return createNode("col_item", 0, undefined, children, {
        style: section.style,
      });
    });

    return {
      node: createNode(
        this.type,
        blockLength(lines, index, block.nextIndex),
        undefined,
        columns,
        { style: containerStyle },
      ),
      nextIndex: block.nextIndex,
    };
  }

  render(node: MarkdownNode, ctx: RenderContext) {
    const columns = node.children ?? [];
    if (columns.length === 0) return "";

    const containerStyle = String(node.props?.style ?? "");
    const cols = columns
      .map((col) => {
        const style = String(col.props?.style ?? "");
        const body = ctx.renderBlock(col.children ?? []);
        return `<div class="penna-cols__col"${styleAttr(style)}>${body}</div>`;
      })
      .join("\n");

    return [
      `<div class="penna-cols"${styleAttr(containerStyle)}${this.sourceLineAttrs(node)}>`,
      cols,
      "</div>",
    ].join("\n");
  }
}

export default new ColsBlockParser();
