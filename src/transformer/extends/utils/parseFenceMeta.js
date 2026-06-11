/**
 * @file 围栏代码块 info string 解析
 * @module transformer/extends/utils/parseFenceMeta
 */

import { unescapeHref, decodeHtmlEntities } from "@/transformer/gfm/inline/shared.js";
import {
  mergeLineHighlightSpecs,
  parseLineHighlightSpec,
} from "@/transformer/extends/utils/parseLineHighlight.js";

/**
 * @param {string} lang
 * @returns {string}
 */
function stripLangSuffixModifiers(lang) {
  return lang.replace(/:collapsed-lines(?:=\d+)?/gi, "").trim();
}

/**
 * 从语言 token 分离 `js{1,4}` 形式。
 *
 * @param {string} token
 * @returns {{ lang: string, lineSpec: string }}
 */
function splitLangAndLineSpec(token) {
  const decoded = decodeHtmlEntities(unescapeHref(token));
  const withoutCollapse = stripLangSuffixModifiers(decoded);
  const match = withoutCollapse.match(/^([^{]*?)\{([^}]+)\}$/);
  if (match) {
    return { lang: match[1] ?? "", lineSpec: match[2] ?? "" };
  }
  return { lang: withoutCollapse, lineSpec: "" };
}

/**
 * @param {string} info
 * @returns {{ collapsedLines: boolean, collapsedMaxLines?: number }}
 */
function parseCollapsedLinesMeta(info) {
  const attached = info.match(/:collapsed-lines(?:=(\d+))?/i);
  if (attached) {
    return {
      collapsedLines: true,
      collapsedMaxLines: attached[1] ? Number.parseInt(attached[1], 10) : undefined,
    };
  }

  for (const token of info.split(/\s+/)) {
    const tokenMatch = token.match(/^:collapsed-lines(?:=(\d+))?$/i);
    if (tokenMatch) {
      return {
        collapsedLines: true,
        collapsedMaxLines: tokenMatch[1] ? Number.parseInt(tokenMatch[1], 10) : undefined,
      };
    }
  }

  return { collapsedLines: false };
}

/**
 * 从围栏开标记行解析语言、title 与行高亮。
 *
 * 支持：
 * - ` ```js{1,4,6-8} `
 * - ` ```json title="package.json" {2-3} `
 *
 * @param {string} line
 * @returns {{
 *   lang: string,
 *   title: string,
 *   highlightLines: number[],
 *   collapsedLines: boolean,
 *   collapsedMaxLines?: number
 * } | null}
 */
export function parseFenceMeta(line) {
  const match = line.match(/^( {0,3})((`{3,})([^`]*)|(~{3,})(.*))$/);
  if (!match) return null;

  const info = (match[4] || match[6] || "").trim();
  const firstToken = info.split(/\s+/)[0] ?? "";
  const { lang: langFromToken, lineSpec: tokenLineSpec } = splitLangAndLineSpec(firstToken);

  let highlightLines = tokenLineSpec ? parseLineHighlightSpec(tokenLineSpec) : [];

  let restInfo = info;
  if (firstToken) {
    const tokenIndex = info.indexOf(firstToken);
    if (tokenIndex >= 0) {
      restInfo = info.slice(tokenIndex + firstToken.length).trim();
    }
  }
  const infoWithoutTitle = restInfo.replace(
    /\btitle=(?:"[^"]*"|'[^']*'|[^\s]+)/gi,
    "",
  );
  for (const braceMatch of infoWithoutTitle.matchAll(/\{([0-9,\-\s]+)\}/g)) {
    highlightLines = mergeLineHighlightSpecs(
      highlightLines,
      parseLineHighlightSpec(braceMatch[1] ?? ""),
    );
  }

  let title = "";
  const titleMatch = info.match(/\btitle=(?:"([^"]*)"|'([^']*)'|([^\s]+))/i);
  if (titleMatch) {
    title = decodeHtmlEntities(
      unescapeHref(titleMatch[1] ?? titleMatch[2] ?? titleMatch[3] ?? ""),
    );
  }

  const collapsed = parseCollapsedLinesMeta(info);

  return {
    lang: langFromToken,
    title,
    highlightLines,
    collapsedLines: collapsed.collapsedLines,
    collapsedMaxLines: collapsed.collapsedMaxLines,
  };
}
