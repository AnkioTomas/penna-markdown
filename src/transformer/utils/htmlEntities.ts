/**
 * @file HTML 实体解析
 * @module transformer/utils/htmlEntities
 *
 * GFM / HTML5 命名实体与数字字符引用解析。
 */

import { decodeHTMLStrict } from "entities";

// 1. 修复正则：必须以 ^ 开头，且绝对不能有 /g 全局标志！
// 命名实体规则：以字母开头，后跟 0-31 个字母或数字。
const ENTITY_START_RE = /^&(?:#[xX][0-9a-fA-F]{1,6}|#[0-9]{1,7}|[A-Za-z][A-Za-z0-9]{0,31});/;

/**
 * 从 src[index] 起尝试匹配并解码 HTML 实体。
 */
export function tryParseEntity(src: string, index: number): { value: string; length: number; } | null {
  // 第一重快筛
  if (src[index] !== "&") return null;

  // 核心性能优化：实体最长也就是 34 个字符 (例如 &CounterClockwiseContourIntegral;)
  // 我们只切片最多 35 个字符！完全避免了拷贝剩余几万字文档带来的内存爆炸。
  const chunk = src.slice(index, index + 35);

  const match = ENTITY_START_RE.exec(chunk);
  if (!match) return null;

  const raw = match[0];
  const decoded = decodeHTMLStrict(raw);

  // 如果解码后和原文一模一样，说明这个命名实体不合法（不是 W3C 规范里的实体）
  if (decoded === raw) {
    return null;
  }

  return { value: decoded, length: raw.length };
}

/**
 * 全局解码工具（用于在某些特殊块级语法里全文替换实体）
 */
const ENTITY_GLOBAL_RE = /&(?:#[xX][0-9a-fA-F]{1,6}|#[0-9]{1,7}|[A-Za-z][A-Za-z0-9]{0,31});/g;

export function decodeHtmlEntities(text: string): string {
  return text.replace(ENTITY_GLOBAL_RE, (match) => {
    const decoded = decodeHTMLStrict(match);
    return decoded === match ? match : decoded;
  });
}