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
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";

/** 步骤块开标记行：`::: steps` */
const OPEN_RE = /^ {0,3}:::(?!:)\s+steps\s*$/;

/** 步骤块闭标记行：`:::` */
const CLOSE_RE = /^ {0,3}:::\s*$/;

/** 嵌套三冒号容器开标记（排除四冒号块） */
const NESTED_OPEN_RE = /^ {0,3}:::(?!:)\s+\S/;

/** 步骤标题行：`1. 标题` */
const STEP_HEAD_RE = /^ {0,3}(\d+)\.\s+(.*)$/;

/**
 * 读取步骤块内部行，正确处理嵌套 `:::` 容器。
 *
 * @param {string[]} lines
 * @param {number} start
 * @returns {{ innerLines: string[], nextIndex: number } | null}
 */
function readStepsInnerLines(lines, start) {
  const innerLines = [];
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

/**
 * 将内部行拆分为多个步骤段。
 *
 * @param {string[]} lines
 * @returns {Array<{ title: string, contentLines: string[] }>}
 */
function parseStepSections(lines) {
  const sections = [];
  let current = null;

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

/**
 * 步骤条块解析器。
 *
 * @extends {BaseBlockParser}
 */
class StepsBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "steps", priority: 88 });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const line = lines[index] ?? "";
    if (!OPEN_RE.test(line)) return null;

    const block = readStepsInnerLines(lines, index + 1);
    if (!block) return null;

    const { innerLines, nextIndex } = block;

    const sections = parseStepSections(normalizeInnerLines(innerLines));
    if (sections.length === 0) return null;

    const steps = sections.map((section) =>
      createNode("step_item", {
        title: section.title,
        titleNodes: section.title
          ? ctx.parseInline(section.title)
          : [],
        children: ctx.parseBlocks(normalizeInnerLines(section.contentLines)),
      }),
    );

    return {
      node: createNode(this.type, { children: steps }),
      nextIndex,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const steps = node.children ?? [];
    if (steps.length === 0) return "";

    const items = steps.map((step) => {
      const titleHtml = step.titleNodes?.length
        ? `<p>${ctx.renderInline(step.titleNodes)}</p>`
        : "";
      const bodyHtml = ctx.renderBlock(step.children ?? []);
      return `<li>${titleHtml}${bodyHtml}</li>`;
    });

    return `<div class="cherry-steps"><ol>${items.join("")}</ol></div>`;
  }
}

export default new StepsBlockParser();
