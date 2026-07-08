/**
 * @file 块级语法拓展：步骤条
 * @module transformer/extends/block/steps
 *
 * 语法示例：
 * ```
 * ::: steps
 *
 * 1. 步骤 1
 *
 *   相关内容
 *
 * 2. 步骤 2
 *
 *   相关内容
 *
 * :::
 * ```
 *
 * 以 `1.` / `2.` 标题行划分步骤；标题后直至下一标题前的内容为步骤正文。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import {
  createNode,
  type MarkdownNode,
} from "@/transformer/core/MarkdownNode.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import { blockLength } from "@/transformer/extends/block/card/shared";

/** 步骤块开标记行：`::: steps` */
const OPEN_RE = /^ {0,3}:::(?!:)\s+steps\s*$/;

/** 步骤块闭标记行：`:::` */
const CLOSE_RE = /^ {0,3}:::\s*$/;

/** 嵌套三冒号容器开标记（排除四冒号块） */
const NESTED_OPEN_RE = /^ {0,3}:::(?!:)\s+\S/;

/** 步骤标题行：`1. 标题` */
const STEP_HEAD_RE = /^ {0,3}(\d+)\.\s+(.*)$/;

function readStepsInnerLines(
  lines: string[],
  start: number,
): { innerLines: string[]; nextIndex: number } | null {
  const innerLines: string[] = [];
  let depth = 0;
  let i = start;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (CLOSE_RE.test(line)) {
      if (depth === 0) {
        return { innerLines, nextIndex: i + 1 };
      }
      depth -= 1;
      innerLines.push(line);
      i += 1;
      continue;
    }

    if (NESTED_OPEN_RE.test(line)) {
      depth += 1;
    }

    innerLines.push(line);
    i += 1;
  }

  return null;
}

function parseStepSections(lines: string[]) {
  const sections: Array<{ title: string; contentLines: string[] }> = [];
  let current: { title: string; contentLines: string[] } | null = null;

  for (const line of lines) {
    const head = line.match(STEP_HEAD_RE);
    if (head) {
      if (current) sections.push(current);
      current = {
        title: head[2].trim(),
        contentLines: [],
      };
      continue;
    }
    if (current) current.contentLines.push(line);
  }

  if (current) sections.push(current);
  return sections;
}

class StepsBlockParser extends BaseBlockParser {
  constructor() {
    super("steps");
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return OPEN_RE.test(lines[index] ?? "");
  }

  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const line = lines[index] ?? "";
    if (!OPEN_RE.test(line)) return null;

    const block = readStepsInnerLines(lines, index + 1);
    if (!block) return null;

    const sections = parseStepSections(normalizeInnerLines(block.innerLines));
    if (sections.length === 0) return null;

    const steps = sections.map((section) => {
      const titleNodes = section.title ? ctx.parseInline(section.title) : [];
      return createNode(
        "step_item",
        0,
        undefined,
        ctx.parseBlocks(normalizeInnerLines(section.contentLines)),
        { title: section.title, titleNodes },
      );
    });

    return {
      node: createNode(
        this.type,
        blockLength(lines, index, block.nextIndex),
        undefined,
        steps,
      ),
      nextIndex: block.nextIndex,
    };
  }

  render(node: MarkdownNode, ctx: RenderContext) {
    const steps = node.children ?? [];
    if (steps.length === 0) return "";

    const items = steps.map((step) => {
      const titleNodes =
        (step.props?.titleNodes as MarkdownNode[] | undefined) ?? [];
      const titleHtml = titleNodes.length
        ? `<p>${ctx.renderInline(titleNodes)}</p>`
        : "";
      const bodyHtml = ctx.renderBlock(step.children ?? []);
      return `<li>${titleHtml}${bodyHtml}</li>`;
    });

    return `<div class="cherry-steps"${this.sourceLineAttrs(node)}><ol>${items.join("")}</ol></div>`;
  }
}

export default new StepsBlockParser();
