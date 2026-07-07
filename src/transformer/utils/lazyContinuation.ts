import { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import { isIndentedCodeLine } from "@/transformer/utils/tabs.js";

/**
 * 递归寻找 AST 树中最深且最右侧的节点 (Deepest Open Block)
 */
export function getDeepestNode(nodes: MarkdownNode[]): MarkdownNode | null {
  if (!nodes || nodes.length === 0) return null;

  const last = nodes[nodes.length - 1];

  // 【关键修复】：如果当前节点已经是段落了，立刻返回！
  // 绝对不能再往 last.children 里钻了，因为段落的 children 是 Inline 文本节点！
  if (last.type === "paragraph") {
    return last;
  }

  // 如果是其他的容器块（比如 blockquote, list），继续深挖
  if (last.children && last.children.length > 0) {
    return getDeepestNode(last.children);
  }

  return last;
}

/**
 * 通用惰性延续判断 (可供 Blockquote, List, ListItem 等所有容器块复用)
 * * @param ctx 全局解析上下文
 * @param ctx
 * @param currentLines 容器当前已经收集的行
 * @param nextLine 准备探测的下一行 (不带当前容器前缀的行)
 * @param parseFn 降维解析函数，传入为了避免循环依赖
 */
export function canGenericLazyContinue(
  ctx: BlockParseContext,
  currentLines: string[],
  nextLine: string,
  parseFn: (lines: string[]) => MarkdownNode[],
): boolean {
  if (currentLines.length === 0) return false;
  // 缩进代码行（4 空格）不算强块级起点，见 CommonMark §4.8 / GFM #216
  if (ctx.canStrongBreak([nextLine], 0) && !isIndentedCodeLine(nextLine)) {
    return false;
  }

  // 规则 2：探底评估
  // 将当前收集到的文本临时解析为 AST
  const tempAst = parseFn(currentLines);
  const deepest = getDeepestNode(tempAst);

  // 规则 3：只要最深处（不管隔了多少层）是一个段落，就允许这行纯文本“掉落”进去
  return deepest?.type === "paragraph";
}
