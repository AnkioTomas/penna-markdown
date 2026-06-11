/**
 * @file 数学公式共享解析
 * @module transformer/extends/math/shared
 */

import { isEscaped } from "@/transformer/gfm/inline/shared.js";

/**
 * 解析行内数学 `$...$`（不匹配 `$$`）。
 *
 * @param {string} src
 * @param {number} index
 * @returns {{ content: string, nextIndex: number } | null}
 */
export function parseInlineMathDelimited(src, index) {
  if (src[index] !== "$" || isEscaped(src, index)) return null;
  if (src[index + 1] === "$") return null;

  let i = index + 1;
  let content = "";

  while (i < src.length) {
    const ch = src[i];

    if (ch === "\\" && i + 1 < src.length) {
      content += src.slice(i, i + 2);
      i += 2;
      continue;
    }

    if (ch === "$") {
      if (src[i + 1] === "$") return null;
      if (!content.trim()) return null;
      return { content, nextIndex: i + 1 };
    }

    content += ch;
    i += 1;
  }

  return null;
}
