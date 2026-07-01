/**
 * @file 字段语法公共工具
 * @module transformer/extends/block/field/shared
 */

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
  const bodyLines: string[] = [];

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
