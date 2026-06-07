/**
 * 行内解析共享工具
 */

/**
 * 定界符前奇数个 `\` 表示该字符被转义。
 */
export function isEscaped(src, index) {
  let n = 0;
  for (let i = index - 1; i >= 0 && src[i] === "\\"; i -= 1) n += 1;
  return n % 2 === 1;
}

/** GFM destination / title 中可反斜杠转义的 ASCII 标点 */
export function isAsciiPunct(ch) {
  return /[!-/:-@\[-`{-~]/.test(ch);
}

/** 解析 link destination 后去掉反斜杠转义 */
export function unescapeHref(href) {
  let out = "";
  for (let i = 0; i < href.length; i++) {
    if (href[i] === "\\" && i + 1 < href.length && isAsciiPunct(href[i + 1])) {
      out += href[i + 1];
      i += 1;
    } else {
      out += href[i];
    }
  }
  return out;
}

const HTML_NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  auml: "ä",
  Auml: "Ä",
  ouml: "ö",
  Ouml: "Ö",
  uuml: "ü",
  Uuml: "Ü",
};

/** destination / title 中的 HTML 实体解码 */
export function decodeHtmlEntities(text) {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const cp = parseInt(hex, 16);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : _;
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const cp = parseInt(dec, 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : _;
    })
    .replace(/&([a-zA-Z][a-zA-Z0-9]+);/g, (entity, name) => HTML_NAMED_ENTITIES[name] ?? entity);
}

/** 保留已有 %XX 序列，对其余字符做 URI 编码 */
export function normalizeLinkDestination(href) {
  href = decodeHtmlEntities(unescapeHref(href));
  let out = "";
  for (let i = 0; i < href.length; i++) {
    if (href[i] === "%" && i + 2 < href.length && /^[0-9A-Fa-f]{2}$/.test(href.slice(i + 1, i + 3))) {
      out += href.slice(i, i + 3);
      i += 2;
      continue;
    }
    const cp = href.codePointAt(i);
    const ch = String.fromCodePoint(cp);
    if (/^[A-Za-z0-9\-._~:/?#@!$&'()*+,;=]$/.test(ch)) {
      out += ch;
    } else {
      out += encodeURIComponent(ch);
    }
    if (cp > 0xffff) i++;
  }
  return out;
}

export function normalizeLinkTitle(title) {
  return decodeHtmlEntities(unescapeHref(title));
}

/**
 * 解析 `<...>` destination；闭合 `>` 必须未转义（Example 502）。
 * @returns {{ href: string, next: number } | null}
 */
export function findUnescapedAngleClose(src, openIndex) {
  let k = openIndex + 1;
  while (k < src.length) {
    if (src[k] === "\n") return -1;
    if (src[k] === "\\") {
      if (k + 1 < src.length && isAsciiPunct(src[k + 1])) {
        k += 2;
        continue;
      }
      k += 1;
      continue;
    }
    if (src[k] === ">") return k;
    if (src[k] === "<") return -1;
    k += 1;
  }
  return -1;
}

export function parseAngleDestination(src, start) {
  const close = findUnescapedAngleClose(src, start);
  if (close === -1) return null;
  return { href: src.slice(start + 1, close), next: close + 1 };
}

/**
 * 解析非尖括号 destination；转义括号不参与平衡计数（Example 504–508）。
 * @returns {{ href: string, next: number }}
 */
export function parsePlainDestination(src, start) {
  let k = start;
  let pLevel = 0;
  while (k < src.length) {
    if (src[k] === "\\") {
      if (k + 1 < src.length && isAsciiPunct(src[k + 1])) {
        k += 2;
        continue;
      }
      k += 1;
      continue;
    }
    const char = src[k];
    if (char === "(") pLevel += 1;
    else if (char === ")") {
      if (pLevel === 0) break;
      pLevel -= 1;
    } else if (/[ \t\r\n\v\f]/.test(char)) {
      break;
    }
    k += 1;
  }
  return { href: src.slice(start, k), next: k };
}

/** 与 html.js 一致，用于 link label 扫描时跳过 HTML */
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

function skipWhitespace(src, i) {
  while (i < src.length && /[ \t\r\n\v\f]/.test(src[i])) i++;
  return i;
}

function skipCodeSpan(src, i) {
  const match = src.slice(i).match(/^(`+)/);
  if (!match) return i;
  const len = match[1].length;
  let j = i + len;
  while (j < src.length) {
    if (src[j] === "`") {
      const endMatch = src.slice(j).match(/^(`+)/);
      if (endMatch && endMatch[1].length === len) return j + len;
      if (endMatch) j += endMatch[1].length;
      else j++;
    } else j++;
  }
  return i;
}

function skipHtmlOrAutolink(src, i) {
  if (src[i] !== "<") return i;
  const slice = src.slice(i);
  const html = slice.match(HTML_TAG_RE);
  if (html) return i + html[0].length;
  const close = src.indexOf(">", i + 1);
  if (close !== -1) return close + 1;
  return i;
}

/** inline link 的 label 闭合 `]`：level 回到 1 且后继为 `(` */
function findInlineLinkLabelEnd(src, start) {
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
    if (src[i] === "[") level++;
    else if (src[i] === "]") {
      if (level === 1) {
        const j = skipWhitespace(src, i + 1);
        if (src[j] === "(") return i;
      }
      level--;
      if (level === 0) return -1;
    }
    i++;
  }
  return -1;
}

/**
 * 尝试跳过 `[label](dest)` inline link，返回结束位置；失败返回 start。
 */
export function trySkipInlineLink(src, i) {
  if (src[i] !== "[") return i;

  if (src[i + 1] === "[") {
    const inner = trySkipInlineLink(src, i + 1);
    if (inner > i + 1) return i;
  }

  const labelEnd = findInlineLinkLabelEnd(src, i + 1);
  if (labelEnd === -1) return i;

  let j = skipWhitespace(src, labelEnd + 1);
  if (src[j] !== "(") return i;

  j = skipInlineLinkDestination(src, j);
  if (j === i) return i;

  j = skipWhitespace(src, j);

  if (src[j] === '"' || src[j] === "'" || src[j] === "(") {
    const closer = src[j] === "(" ? ")" : src[j];
    let k = j + 1;
    while (k < src.length) {
      if (src[k] === "\\") k += 2;
      else if (src[k] === closer) {
        j = k + 1;
        break;
      } else k++;
    }
  }

  j = skipWhitespace(src, j);
  if (src[j] !== ")") return i;
  return j + 1;
}

function skipInlineLinkDestination(src, start) {
  if (src[start] !== "(") return start;

  let j = start + 1;
  j = skipWhitespace(src, j);

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

/**
 * 尝试跳过 `![alt](dest)` inline image，返回结束位置；失败返回 start。
 */
export function trySkipInlineImage(src, i) {
  if (src[i] !== "!" || src[i + 1] !== "[") return i;

  const labelEnd = findLinkTextEnd(src, i + 2);
  if (labelEnd === -1) return i;

  let j = skipWhitespace(src, labelEnd + 1);
  if (src[j] !== "(") return i;

  j = skipInlineLinkDestination(src, j);
  if (j === i) return i;

  j = skipWhitespace(src, j);

  if (src[j] === '"' || src[j] === "'" || src[j] === "(") {
    const closer = src[j] === "(" ? ")" : src[j];
    let k = j + 1;
    while (k < src.length) {
      if (src[k] === "\\") k += 2;
      else if (src[k] === closer) {
        j = k + 1;
        break;
      } else k++;
    }
  }

  j = skipWhitespace(src, j);
  if (src[j] !== ")") return i;
  return j + 1;
}

/**
 * 尝试跳过 reference link 语法（shortcut / full / collapsed），返回结束位置；失败返回 start。
 */
export function trySkipReferenceLink(src, i) {
  if (src[i] !== "[") return i;

  const labelEnd = findLinkTextEnd(src, i + 1);
  if (labelEnd === -1) return i;

  const next = skipWhitespace(src, labelEnd + 1);
  if (src[next] === "[") {
    const refEnd = findLinkTextEnd(src, next + 1);
    if (refEnd !== -1) return refEnd + 1;
    return i;
  }

  if (src[next] !== "(" && src[next] !== "[") {
    const label = src.slice(i + 1, labelEnd);
    if (/\s/.test(label)) return i;
    return labelEnd + 1;
  }

  return i;
}

function countDestPatternsAfter(src, from) {
  let count = 0;
  for (let i = from; i < src.length; i++) {
    if (src[i] === "]") {
      const j = skipWhitespace(src, i + 1);
      if (src[j] === "(") count++;
    }
  }
  return count;
}

/**
 * 查找 link label / image alt 的闭合 `]`。
 * 遵循 GFM：code/html/autolink 优先；label 内 inline link 整块跳过。
 */
export function findLinkTextEnd(src, start) {
  let level = 1;
  let i = start;
  let justSkippedLink = false;

  while (i < src.length) {
    if (src[i] === "\\") {
      i += 2;
      justSkippedLink = false;
      continue;
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
      level++;
      justSkippedLink = false;
    } else if (src[i] === "]") {
      if (level === 1 && justSkippedLink) {
        const j = skipWhitespace(src, i + 1);
        if (src[j] === "(" && countDestPatternsAfter(src, i) === 1) {
          level--;
          if (level === 0) return i;
        } else if (src[j] !== "(") {
          level--;
          if (level === 0) return i;
        }
        i++;
        justSkippedLink = false;
        continue;
      }
      level--;
      if (level === 0) return i;
      justSkippedLink = false;
    } else {
      justSkippedLink = false;
    }
    i++;
  }
  return -1;
}

export function containsNestedLink(nodes) {
  for (const n of nodes) {
    if (n.type === "link") return true;
    if (n.children?.length && containsNestedLink(n.children)) return true;
  }
  return false;
}

export function containsNestedLinkOrImage(nodes) {
  for (const n of nodes) {
    if (n.type === "link" || n.type === "image") return true;
    if (n.children?.length && containsNestedLinkOrImage(n.children)) return true;
  }
  return false;
}

/**
 * 从 index 起用正则匹配定界行内语法；捕获组 1 为内部文本。
 *
 * @param {RegExp} re - 须以 ^ 锚定，且含 (.+?) 等内容捕获组
 */
export function matchDelimited(src, index, re) {
  if (isEscaped(src, index)) return null;
  const m = src.slice(index).match(re);
  if (!m || m[1] == null || m[1].length === 0) return null;
  return { inner: m[1], length: m[0].length };
}
