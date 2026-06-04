/**
 * GFM Autolinks - both bracketed (<uri>) and bare (www.example.com)
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";

const SCHEME_RE = /^[A-Za-z][A-Za-z0-9+.-]{1,31}$/;
const EMAIL_RE =
  /^[a-zA-Z0-9+._-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*[a-zA-Z0-9]$/;

// Domain segment: alphanumeric, hyphens, underscores
// Domain: segments separated by periods, at least one period, no underscores in last two segments
const DOMAIN_SEGMENT_RE = /[A-Za-z0-9_-]+/;
const DOMAIN_RE = /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)*[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

function isUriChar(ch) {
  const c = ch.charCodeAt(0);
  if (c < 0x20 || c === 0x7f) return false;
  return ch !== "<" && ch !== ">" && ch !== " " && ch !== "\t" && ch !== "\n" && ch !== "\r";
}

function isAutolinkDelimiter(ch) {
  // Autolinks can only come at beginning of line, after whitespace, or after * _ ~ (
  return ch === undefined || /\s/.test(ch) || "*_~(".includes(ch);
}

function encodeHref(uri) {
  let out = "";
  for (let i = 0; i < uri.length; i += 1) {
    const ch = uri[i];
    if (isUriChar(ch) && !'"<>{}|\\^`[]'.includes(ch)) {
      out += ch;
    } else {
      const bytes = new TextEncoder().encode(ch);
      for (const b of bytes) {
        out += `%${b.toString(16).toUpperCase().padStart(2, "0")}`;
      }
    }
  }
  return out;
}

function parseEmailAutolink(inner) {
  if (!inner.includes("@") || inner.includes("\\")) return null;
  if (!EMAIL_RE.test(inner)) return null;
  return {
    url: `mailto:${inner}`,
    label: inner,
  };
}

function isValidDomain(domain) {
  // Must have at least one period
  if (!domain.includes(".")) return false;
  // No underscores in last two segments
  const parts = domain.split(".");
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const secondLast = parts[parts.length - 2];
    if (last.includes("_") || secondLast.includes("_")) return false;
  }
  return DOMAIN_RE.test(domain);
}

/** Trim trailing punctuation that shouldn't be part of autolink */
function trimTrailingPunctuation(label) {
  // Trailing punctuation: ? ! . , : * _ ~
  while (label.length > 0 && "?!.,:*~_".includes(label[label.length - 1])) {
    label = label.slice(0, -1);
  }
  return label;
}

/** Check for entity reference at end: & followed by alphanumerics and ends with ; */
function hasEntityReferenceAtEnd(text) {
  if (text[text.length - 1] !== ";") return false;
  // Find last & before ;
  let semiIdx = text.length - 1;
  let ampIdx = -1;
  for (let i = semiIdx - 1; i >= 0; i--) {
    if (text[i] === "&") {
      ampIdx = i;
      break;
    }
    if (!/[a-zA-Z0-9]/.test(text[i])) {
      break;
    }
  }
  if (ampIdx === -1) return false;
  const entity = text.slice(ampIdx + 1, semiIdx);
  return /^[a-zA-Z0-9]+$/.test(entity) && entity.length > 0;
}

function parseUriAutolink(text) {
  // Check for http://, https://, ftp:// schemes
  for (const scheme of ["http://", "https://", "ftp://"]) {
    if (text.startsWith(scheme)) {
      const rest = text.slice(scheme.length);
      if (rest.length > 0) {
        // Extract domain part
        let domainEnd = 0;
        while (domainEnd < rest.length && isUriChar(rest[domainEnd])) domainEnd++;
        if (domainEnd > 0) {
          const domain = rest.slice(0, domainEnd);
          if (isValidDomain(domain)) {
            const autolinkEnd = findAutolinkEnd(text, scheme.length + domainEnd);
            const fullAutolink = text.slice(0, autolinkEnd);
            // Check for entity reference at end
            const trimmed = hasEntityReferenceAtEnd(fullAutolink)
              ? fullAutolink.slice(0, -1)
              : fullAutolink;
            return {
              url: encodeHref(trimmed),
              label: trimmed,
            };
          }
        }
      }
      break;
    }
  }

  // Check for www. prefix
  if (text.startsWith("www.")) {
    const rest = text.slice(4);
    if (rest.length > 0) {
      let domainEnd = 0;
      while (domainEnd < rest.length && isUriChar(rest[domainEnd])) domainEnd++;
      if (domainEnd > 0) {
        const domain = rest.slice(0, domainEnd);
        if (isValidDomain(domain)) {
          const autolinkEnd = findAutolinkEnd(text, 4 + domainEnd);
          const fullAutolink = text.slice(0, autolinkEnd);
          const trimmed = hasEntityReferenceAtEnd(fullAutolink)
            ? fullAutolink.slice(0, -1)
            : fullAutolink;
          return {
            url: encodeHref("http://" + trimmed),
            label: trimmed,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Find the end of an autolink, handling parentheses matching.
 * Returns the index one past the last character that should be included.
 */
function findAutolinkEnd(text, initialEnd) {
  // First, trim trailing punctuation (but keep them for parenthesis counting)
  let endIdx = initialEnd;
  while (endIdx > 0 && "?!.,:*~_".includes(text[endIdx - 1])) {
    endIdx--;
  }

  // If ends with ), count parentheses to handle unmatched closing parens
  if (endIdx < text.length && text[endIdx] === ")") {
    let parenCount = 0;
    for (let i = 0; i < endIdx; i++) {
      if (text[i] === "(") parenCount++;
      else if (text[i] === ")") parenCount--;
    }
    // If closing parens exceed opening ones, don't include unmatched closing parens
    if (parenCount < 0) {
      // Find where to cut - keep unclosed parens outside
      let cutIdx = endIdx;
      let balance = 0;
      for (let i = 0; i < endIdx; i++) {
        if (text[i] === "(") balance++;
        else if (text[i] === ")") balance--;
        if (balance < 0) {
          cutIdx = i;
          break;
        }
      }
      return cutIdx;
    }
  }

  return initialEnd;
}

class BracketedAutolinkInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "autolink", priority: 90 });
  }

  parse(src, index, parseInline) {
    if (src[index] !== "<") return null;

    const close = src.indexOf(">", index + 1);
    if (close === -1) return null;

    const inner = src.slice(index + 1, close);
    if (inner.length === 0) return null;

    for (const ch of inner) {
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") return null;
    }

    const link = parseEmailAutolink(inner) ?? parseUriAutolink(inner);
    if (!link) {
      // Not a valid autolink, render as literal <...>
      return {
        node: createNode("text", { value: `<${inner}>` }),
        nextIndex: close + 1,
      };
    }

    return {
      node: createNode(this.type, {
        url: link.url,
        label: link.label,
      }),
      nextIndex: close + 1,
    };
  }

  render(node, renderInline) {
    const { url, label } = node.props ?? {};
    return `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
  }
}

class BareAutolinkInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "autolink", priority: 80 });
  }

  parse(src, index, parseInline) {
    // Autolinks can only come at beginning of line, after whitespace, or after * _ ~ (
    if (index > 0 && !isAutolinkDelimiter(src[index - 1])) return null;

    // Try to match www. or http(s):// or ftp:// or email
    let match = null;

    // Check for email first (can appear anywhere)
    const emailMatch = src.slice(index).match(/^[a-zA-Z0-9+._-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*[a-zA-Z0-9]/);
    if (emailMatch) {
      const email = emailMatch[0];
      // Check if followed by non-delimiter (continuing identifier)
      const nextIdx = index + email.length;
      if (nextIdx < src.length && /[a-zA-Z0-9+._-@]/.test(src[nextIdx])) {
        // Continue reading the email - check if it's a longer email
        let fullEmailEnd = nextIdx;
        while (fullEmailEnd < src.length && /[a-zA-Z0-9+._-]/.test(src[fullEmailEnd])) {
          fullEmailEnd++;
        }
        const fullEmail = src.slice(index, fullEmailEnd);
        if (parseEmailAutolink(fullEmail)) {
          match = {
            url: `mailto:${fullEmail}`,
            label: fullEmail,
            length: fullEmail.length,
          };
        }
      } else {
        match = {
          url: `mailto:${email}`,
          label: email,
          length: email.length,
        };
      }
    }

    // Check for www. prefix (must follow delimiter)
    if (!match && src[index] === "w" && src.slice(index, index + 4) === "www.") {
      const restStart = index + 4;
      let domainEnd = restStart;
      while (domainEnd < src.length && isUriChar(src[domainEnd])) domainEnd++;

      if (domainEnd > restStart) {
        const domain = src.slice(restStart, domainEnd);
        if (isValidDomain(domain)) {
          const autolinkEnd = findAutolinkEnd(src, domainEnd);
          const fullAutolink = src.slice(index, autolinkEnd);
          match = {
            url: encodeHref("http://" + fullAutolink),
            label: fullAutolink,
            length: autolinkEnd - index,
          };
        }
      }
    }

    // Check for http://, https://, ftp://
    if (!match) {
      for (const scheme of ["http://", "https://", "ftp://"]) {
        if (src.slice(index, index + scheme.length) === scheme) {
          const restStart = index + scheme.length;
          let domainEnd = restStart;
          while (domainEnd < src.length && isUriChar(src[domainEnd])) domainEnd++;

          if (domainEnd > restStart) {
            const domain = src.slice(restStart, domainEnd);
            if (isValidDomain(domain)) {
              const autolinkEnd = findAutolinkEnd(src, domainEnd);
              const fullAutolink = src.slice(index, autolinkEnd);
              const trimmed = hasEntityReferenceAtEnd(fullAutolink)
                ? fullAutolink.slice(0, -1)
                : fullAutolink;
              match = {
                url: encodeHref(trimmed),
                label: trimmed,
                length: autolinkEnd - index,
              };
              break;
            }
          }
        }
      }
    }

    if (!match) return null;

    // Verify it starts at current index and is at valid position
    if (index > 0 && !isAutolinkDelimiter(src[index - 1])) return null;

    return {
      node: createNode(this.type, {
        url: match.url,
        label: match.label,
      }),
      nextIndex: index + match.length,
    };
  }

  render(node, renderInline) {
    const { url, label } = node.props ?? {};
    return `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
  }
}

export default new BracketedAutolinkInlineParser();
export { BareAutolinkInlineParser };
