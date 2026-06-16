/**
 * @file 链接 label / alt 扫描
 * @module transformer/utils/linkLabel
 *
 * 查找 `[...]` 闭合位置、检测嵌套链接等。
 */

import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { isEscaped } from "@/transformer/utils/escape.js";
import { scanDelims } from "@/transformer/utils/flanking.js";
import { skipInlineWhitespace } from "@/transformer/utils/normalize.js";
import {
  parseAngleDestination,
  parsePlainDestination,
} from "@/transformer/utils/linkDestination.js";

const HTML_TAG_RE = (() => {
  const tagname = "[A-Za-z][A-Za-z0-9-]*";
  const attribute_name = "[a-zA-Z_:][a-zA-Z0-9_.:-]*";
  const attribute_value = '(?:[^"\'=<>` \\t\\r\\n]+|\'[^\']*\'|"[^"]*")';
  const attribute = `(?:\\s+${attribute_name}(?:\\s*=\\s*${attribute_value})?)`;
  const open_tag = `<${tagname}${attribute}*\\s*/?>`;
  const close_tag = `</${tagname}\\s*>`;
  const comment = "(?:<!-->|<!--->|<!--(?:(?!-->)[\\s\\S])*-->)";
  const processing_instruction = "<\\?.*?\\?>";
  const declaration = "<![A-Z].*?>";
  const cdata = "<!\\[CDATA\\[.*?\\]\\]>";
  return new RegExp(
    `^(?:${open_tag}|${close_tag}|${comment}|${processing_instruction}|${declaration}|${cdata})`,
    "i",
  );
})();

function skipCodeSpan(src: string, i: number): number {
  const match = src.slice(i).match(/^(`+)/);
  if (!match) return i;
  const len = match[1].length;
  let j = i + len;
  while (j < src.length) {
    if (src[j] === "`") {
      const endMatch = src.slice(j).match(/^(`+)/);
      if (endMatch && endMatch[1].length === len) return j + len;
      if (endMatch) j += endMatch[1].length;
      else j += 1;
    } else {
      j += 1;
    }
  }
  return i;
}

function skipHtmlOrAutolink(src: string, i: number): number {
  if (src[i] !== "<") return i;
  const slice = src.slice(i);
  const html = slice.match(HTML_TAG_RE);
  if (html) return i + html[0].length;
  const close = src.indexOf(">", i + 1);
  if (close !== -1) return close + 1;
  return i;
}

function skipInlineLinkDestination(src: string, start: number): number {
  if (src[start] !== "(") return start;

  let j = start + 1;
  j = skipInlineWhitespace(src, j);

  if (src[j] === "<") {
    const dest = parseAngleDestination(src, j);
    if (!dest) return start;
    j = dest.next;
  } else {
    const dest = parsePlainDestination(src, j);
    j = dest.next;
  }

  return j;
}

function findInlineLinkLabelEnd(src: string, start: number): number {
  let level = 1;
  let i = start;
  while (i < src.length) {
    if (src[i] === "\\") {
      i += 2;
      continue;
    }
    if (src[i] === "`") {
      const next = skipCodeSpan(src, i);
      if (next > i) {
        i = next;
        continue;
      }
    }
    if (src[i] === "<") {
      const next = skipHtmlOrAutolink(src, i);
      if (next > i) {
        i = next;
        continue;
      }
    }
    if (src[i] === "[") level += 1;
    else if (src[i] === "]") {
      if (level === 1) {
        const j = skipInlineWhitespace(src, i + 1);
        if (src[j] === "(") return i;
      }
      level -= 1;
      if (level === 0) return -1;
    }
    i += 1;
  }
  return -1;
}

function trySkipInlineLink(src: string, i: number): number {
  if (src[i] !== "[") return i;

  if (src[i + 1] === "[") {
    const inner = trySkipInlineLink(src, i + 1);
    if (inner > i + 1) return i;
  }

  const labelEnd = findInlineLinkLabelEnd(src, i + 1);
  if (labelEnd === -1) return i;

  let j = skipInlineWhitespace(src, labelEnd + 1);
  if (src[j] !== "(") return i;

  j = skipInlineLinkDestination(src, j);
  if (j === i) return i;

  j = skipInlineWhitespace(src, j);

  if (src[j] === '"' || src[j] === "'" || src[j] === "(") {
    const closer = src[j] === "(" ? ")" : src[j];
    let k = j + 1;
    while (k < src.length) {
      if (src[k] === "\\") k += 2;
      else if (src[k] === closer) {
        j = k + 1;
        break;
      } else {
        k += 1;
      }
    }
  }

  j = skipInlineWhitespace(src, j);
  if (src[j] !== ")") return i;
  return j + 1;
}

function trySkipInlineImage(src: string, i: number): number {
  if (src[i] !== "!" || src[i + 1] !== "[") return i;

  const labelEnd = findLinkTextEnd(src, i + 2);
  if (labelEnd === -1) return i;

  let j = skipInlineWhitespace(src, labelEnd + 1);
  if (src[j] !== "(") return i;

  j = skipInlineLinkDestination(src, j);
  if (j === i) return i;

  j = skipInlineWhitespace(src, j);

  if (src[j] === '"' || src[j] === "'" || src[j] === "(") {
    const closer = src[j] === "(" ? ")" : src[j];
    let k = j + 1;
    while (k < src.length) {
      if (src[k] === "\\") k += 2;
      else if (src[k] === closer) {
        j = k + 1;
        break;
      } else {
        k += 1;
      }
    }
  }

  j = skipInlineWhitespace(src, j);
  if (src[j] !== ")") return i;
  return j + 1;
}

function countDestPatternsAfter(src: string, from: number): number {
  let count = 0;
  for (let i = from; i < src.length; i += 1) {
    if (src[i] === "]") {
      const j = skipInlineWhitespace(src, i + 1);
      if (src[j] === "(") count += 1;
    }
  }
  return count;
}

/**
 * 查找 reference link label 的闭合 `]`。
 * label 内不允许未转义的 `[`。
 */
export function findLinkLabelEnd(src: string, start: number): number {
  let i = start;
  while (i < src.length) {
    if (src[i] === "\\") {
      if (i + 1 < src.length) i += 2;
      else i += 1;
      continue;
    }
    if (src[i] === "[") return -1;
    if (src[i] === "]") return i;
    i += 1;
  }
  return -1;
}

/** 外侧 emphasis 定界符在 link text 的 `]` 之前闭合 → 该 `[` 不构成有效 label。 */
function emphasisClosesLinkTextBeforeEnd(
  src: string,
  openBracket: number,
  pos: number,
): boolean {
  const ch = src[pos];
  if (ch !== "*" && ch !== "_") return false;
  const scanned = scanDelims(src, pos, ch);
  if (!scanned?.canClose) return false;

  let needed = scanned.numdelims;
  let i = openBracket - 1;
  while (i >= 0 && needed > 0) {
    if (src[i] === ch && !isEscaped(src, i)) {
      const openScan = scanDelims(src, i, ch);
      if (openScan?.canOpen) {
        needed -= Math.min(openScan.numdelims, needed);
        if (needed === 0) break;
        i -= openScan.numdelims;
        continue;
      }
    }
    i -= 1;
  }
  if (needed > 0) return false;

  let j = pos + scanned.numdelims;
  while (j < src.length && (src[j] === " " || src[j] === "\t")) j += 1;
  if (src[j] === "]") return false;

  return true;
}

/**
 * 查找 link label / image alt 的闭合 `]`。
 * 遵循 GFM：code/html/autolink 优先；label 内 inline link 整块跳过。
 */
export function findLinkTextEnd(src: string, start: number): number {
  const openBracket = start - 1;
  let level = 1;
  let i = start;
  let justSkippedLink = false;

  while (i < src.length) {
    if (src[i] === "\\") {
      i += 2;
      justSkippedLink = false;
      continue;
    }

    if (level === 1 && emphasisClosesLinkTextBeforeEnd(src, openBracket, i)) {
      return -1;
    }

    if (src[i] === "`") {
      const next = skipCodeSpan(src, i);
      if (next > i) {
        i = next;
        justSkippedLink = false;
        continue;
      }
    }

    if (src[i] === "<") {
      const next = skipHtmlOrAutolink(src, i);
      if (next > i) {
        i = next;
        justSkippedLink = false;
        continue;
      }
    }

    if (src[i] === "[") {
      if (i > 0 && src[i - 1] === "!") {
        const imageEnd = trySkipInlineImage(src, i - 1);
        if (imageEnd > i - 1) {
          i = imageEnd;
          justSkippedLink = true;
          continue;
        }
      }
      const linkEnd = trySkipInlineLink(src, i);
      if (linkEnd > i) {
        i = linkEnd;
        justSkippedLink = true;
        continue;
      }
      level += 1;
      justSkippedLink = false;
    } else if (src[i] === "]") {
      if (level === 1 && justSkippedLink) {
        const j = skipInlineWhitespace(src, i + 1);
        if (src[j] === "(" && countDestPatternsAfter(src, i) === 1) {
          level -= 1;
          if (level === 0) return i;
        } else if (src[j] !== "(") {
          level -= 1;
          if (level === 0) return i;
        }
        i += 1;
        justSkippedLink = false;
        continue;
      }
      level -= 1;
      if (level === 0) return i;
      justSkippedLink = false;
    } else {
      justSkippedLink = false;
    }
    i += 1;
  }
  return -1;
}

/**
 * 节点树中是否含嵌套 link。
 */
export function containsNestedLink(nodes: MarkdownNode[]): boolean {
  for (const n of nodes) {
    if (n.type === "link") return true;
    if (n.children?.length && containsNestedLink(n.children)) return true;
  }
  return false;
}

/**
 * 节点树中是否含嵌套 link 或 image。
 */
export function containsNestedLinkOrImage(nodes: MarkdownNode[]): boolean {
  for (const n of nodes) {
    if (n.type === "link" || n.type === "image") return true;
    if (n.children?.length && containsNestedLinkOrImage(n.children)) return true;
  }
  return false;
}
