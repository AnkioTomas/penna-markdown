/**
 * @file YAML Frontmatter 解析与变量解析
 * @module transformer/extends/utils/frontmatter
 *
 * 提供 frontmatter YAML 文本解析、点分路径变量取值，
 * 以及行内 `[[var.path]]` 占位符的正则与值格式化。
 */

import { parse as parseYaml } from "yaml";

/**
 * 将 YAML 文本解析为 plain object。
 *
 * 空文本、解析失败或非 object 结果均返回 `{}`。
 *
 * @param {string} text
 * @returns {Record<string, unknown>}
 */
export function parseFrontmatterYaml(text) {
  const trimmed = text.trim();
  if (!trimmed) return {};
  try {
    const data = parseYaml(trimmed);
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

/**
 * 按点分路径从 frontmatter 变量对象中取值。
 *
 * 例如 `resolveFrontmatterVar(vars, 'author.name')` 等价于 `vars.author.name`。
 *
 * @param {Record<string, unknown> | null | undefined} vars
 * @param {string} path - 点分路径，如 `title` 或 `meta.date`
 * @returns {unknown} 路径不存在时返回 undefined
 */
export function resolveFrontmatterVar(vars, path) {
  if (!vars || !path) return undefined;
  let current = vars;
  for (const key of path.split(".")) {
    if (current == null || typeof current !== "object" || !(key in current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

/**
 * 将 frontmatter 变量值格式化为可插入 Markdown 的字符串。
 *
 * null / undefined 返回 null（表示应跳过渲染）；对象序列化为 JSON。
 *
 * @param {unknown} value
 * @returns {string | null}
 */
export function formatFrontmatterValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * 行内 frontmatter 变量占位符正则。
 *
 * 匹配 `[[var.path]]` 形式，捕获组 1 为点分路径（仅允许 `\w`、`.`、`-`）。
 *
 * @type {RegExp}
 */
export const FRONTMATTER_VAR_RE = /^\[\[([\w.-]+)\]\]/;
