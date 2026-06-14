/**
 * @file 块级行前导空白
 * @module transformer/utils/blockPrefix
 *
 * CommonMark 块级语法允许行首最多 3 个空格缩进。
 */

/** 块级语法允许的最大前导空格数 */
export const MAX_BLOCK_INDENT = 3;

/**
 * 跳过行首最多 3 个空格，返回内容起始索引。
 */
export function skipBlockPrefixSpaces(line: string): number {
  let i = 0;
  while (i < line.length && line[i] === " " && i < MAX_BLOCK_INDENT) {
    i += 1;
  }
  return i;
}
