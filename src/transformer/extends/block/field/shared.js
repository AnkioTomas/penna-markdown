/**
 * @file 字段语法公共工具
 * @module transformer/extends/block/field/shared
 */

/** 单字段块解析优先级（须高于 container） */
export const FIELD_BLOCK_PRIORITY = 90;

/** 字段组块解析优先级 */
export const FIELD_GROUP_PRIORITY = 91;

/**
 * @param {string[]} lines
 * @returns {{
 *   type: string,
 *   required: boolean,
 *   optional: boolean,
 *   deprecated: boolean,
 *   defaultValue: string,
 *   bodyLines: string[],
 * }}
 */
export function parseFieldDirectives(lines) {
  let type = "";
  let required = false;
  let optional = false;
  let deprecated = false;
  let defaultValue = "";
  const bodyLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      bodyLines.push(line);
      continue;
    }

    if (trimmed === "@required") {
      required = true;
      continue;
    }
    if (trimmed === "@optional") {
      optional = true;
      continue;
    }
    if (trimmed === "@deprecated") {
      deprecated = true;
      continue;
    }

    const typeMatch = trimmed.match(/^@type\s+(.+)$/);
    if (typeMatch) {
      type = typeMatch[1].trim();
      continue;
    }

    const defaultMatch = trimmed.match(/^@default\s+(.*)$/);
    if (defaultMatch) {
      defaultValue = defaultMatch[1].trim();
      continue;
    }

    bodyLines.push(line);
  }

  return {
    type,
    required,
    optional,
    deprecated,
    defaultValue,
    bodyLines,
  };
}
