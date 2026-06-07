/**
 * YAML Frontmatter 解析与变量解析
 */

import { parse as parseYaml } from "yaml";

/** @param {string} text */
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

/** @param {Record<string, unknown> | null | undefined} vars @param {string} path */
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

/** @param {unknown} value */
export function formatFrontmatterValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export const FRONTMATTER_VAR_RE = /^\[\[([\w.-]+)\]\]/;
