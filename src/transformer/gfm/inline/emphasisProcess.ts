/**
 * @file GFM emphasis/strong 定界符处理（CommonMark 两阶段模型）
 * @module transformer/gfm/inline/emphasisProcess
 */

import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { scanDelims } from "@/transformer/utils/flanking.js";

export interface ScannedPart {
  start: number;
  end: number;
  node: MarkdownNode;
}

interface Delimiter {
  pos: number;
  char: "*" | "_";
  numdelims: number;
  origdelims: number;
  canOpen: boolean;
  canClose: boolean;
  previous: Delimiter | null;
  next: Delimiter | null;
}

export interface EmphasisMatch {
  openPos: number;
  closePos: number;
  useDelims: 1 | 2;
  openOrig: number;
  closeOrig: number;
}

function isExcluded(pos: number, excluded: readonly [number, number][]): boolean {
  return excluded.some(([start, end]) => pos >= start && pos < end);
}

function collectDelimiters(src: string, excluded: readonly [number, number][]): Delimiter | null {
  let head: Delimiter | null = null;
  let tail: Delimiter | null = null;

  for (let i = 0; i < src.length; ) {
    if (isExcluded(i, excluded)) {
      const skip = excluded.find(([s, e]) => i >= s && i < e);
      i = skip ? skip[1] : i + 1;
      continue;
    }

    const cc = src[i];
    if (cc !== "*" && cc !== "_") {
      i += 1;
      continue;
    }

    const scanned = scanDelims(src, i, cc);
    if (!scanned) {
      i += 1;
      continue;
    }

    if (scanned.canOpen || scanned.canClose) {
      const entry: Delimiter = {
        pos: i,
        char: cc,
        numdelims: scanned.numdelims,
        origdelims: scanned.numdelims,
        canOpen: scanned.canOpen,
        canClose: scanned.canClose,
        previous: tail,
        next: null,
      };
      if (tail) tail.next = entry;
      else head = entry;
      tail = entry;
    }

    i += scanned.numdelims;
  }

  return head;
}

function openersBottomIndex(d: Delimiter): number {
  if (d.char === "_") {
    return 2 + (d.canOpen ? 3 : 0) + (d.origdelims % 3);
  }
  return 8 + (d.canOpen ? 3 : 0) + (d.origdelims % 3);
}

function unlink(d: Delimiter): void {
  if (d.previous) d.previous.next = d.next;
  if (d.next) d.next.previous = d.previous;
}

function removeDelimitersBetween(bottom: Delimiter, top: Delimiter): void {
  if (bottom.next !== top) {
    bottom.next = top;
    top.previous = bottom;
  }
}

function matchDelimiters(src: string, head: Delimiter | null): EmphasisMatch[] {
  const matches: EmphasisMatch[] = [];
  if (!head) return matches;

  const stackBottom: Delimiter = {
    pos: -1,
    char: "*",
    numdelims: 0,
    origdelims: 0,
    canOpen: false,
    canClose: false,
    previous: null,
    next: head,
  };
  head.previous = stackBottom;

  const openersBottom: Delimiter[] = new Array(14).fill(stackBottom);

  let closer: Delimiter | null = head;
  while (closer !== null) {
    if (!closer.canClose) {
      closer = closer.next;
      continue;
    }

    const bottomIndex = openersBottomIndex(closer);
    let opener: Delimiter | null = closer.previous;
    let openerFound = false;

    while (
      opener !== null &&
      opener !== stackBottom &&
      opener !== openersBottom[bottomIndex]
    ) {
      const oddMatch =
        (closer.canOpen || opener.canClose) &&
        closer.origdelims % 3 !== 0 &&
        (opener.origdelims + closer.origdelims) % 3 === 0;
      if (opener.char === closer.char && opener.canOpen && !oddMatch) {
        openerFound = true;
        break;
      }
      opener = opener.previous;
    }

    const oldCloser = closer;

    if (!openerFound) {
      openersBottom[bottomIndex] = oldCloser.previous ?? stackBottom;
      if (!oldCloser.canOpen) {
        unlink(oldCloser);
      }
      closer = oldCloser.next;
      continue;
    }

    const useDelims: 1 | 2 =
      closer.numdelims >= 2 && opener!.numdelims >= 2 ? 2 : 1;

    const innerStart = opener!.pos + opener!.origdelims;
    const innerStop = closer.pos;
    if (innerStop <= innerStart) {
      openersBottom[bottomIndex] = oldCloser.previous ?? stackBottom;
      if (!oldCloser.canOpen) unlink(oldCloser);
      closer = oldCloser.next;
      continue;
    }

    matches.push({
      openPos: opener!.pos,
      closePos: closer.pos,
      useDelims,
      openOrig: opener!.origdelims,
      closeOrig: closer.origdelims,
    });

    opener!.numdelims -= useDelims;
    closer.numdelims -= useDelims;
    removeDelimitersBetween(opener!, closer);

    if (opener!.numdelims === 0) unlink(opener!);
    if (closer.numdelims === 0) {
      const next = closer.next;
      unlink(closer);
      closer = next;
    }
  }

  while (stackBottom.next !== null) {
    unlink(stackBottom.next);
  }

  return matches;
}

function closeEnd(m: EmphasisMatch): number {
  return m.closePos + m.closeOrig;
}

function contains(outer: EmphasisMatch, inner: EmphasisMatch): boolean {
  if (outer === inner) return false;

  if (inner.openPos === outer.openPos && inner.closePos === outer.closePos) {
    return inner.useDelims > outer.useDelims;
  }

  const outerContentStart = outer.openPos + outer.openOrig;
  const outerContentEnd = outer.closePos;
  const innerContentStart = inner.openPos + inner.openOrig;
  const innerContentEnd = inner.closePos;

  return (
    inner.openPos >= outer.openPos &&
    inner.closePos <= outer.closePos &&
    innerContentStart >= outerContentStart &&
    innerContentEnd <= outerContentEnd &&
    (inner.openPos > outer.openPos || inner.closePos < outer.closePos)
  );
}

function shouldNestChild(
  parent: EmphasisMatch,
  child: EmphasisMatch,
  src: string,
): boolean {
  if (src[parent.openPos] !== src[child.openPos]) return true;
  if (parent.useDelims === 2 && child.useDelims === 2) return false;
  return true;
}

function matchContentStart(m: EmphasisMatch): number {
  return m.openPos + m.openOrig;
}

function matchContentEnd(m: EmphasisMatch): number {
  return m.closePos;
}

function matchesInSpan(
  matches: readonly EmphasisMatch[],
  lo: number,
  hi: number,
): EmphasisMatch[] {
  return matches.filter((m) => {
    const start = matchContentStart(m);
    const end = matchContentEnd(m);
    return start >= lo && end <= hi && start < end;
  });
}

function matchesActiveInSpan(
  matches: readonly EmphasisMatch[],
  lo: number,
  hi: number,
): EmphasisMatch[] {
  return matches.filter((m) => {
    if (m.openPos >= lo && m.closePos <= hi) return true;
    const start = matchContentStart(m);
    const end = matchContentEnd(m);
    return start >= lo && end <= hi && start < end;
  });
}

function topLevelMatches(matches: EmphasisMatch[]): EmphasisMatch[] {
  return matches.filter(
    (m) => !matches.some((other) => other !== m && contains(other, m)),
  );
}

function uniqueTopLevel(matches: EmphasisMatch[]): EmphasisMatch[] {
  const tops = topLevelMatches(matches);
  const seen = new Set<string>();
  return tops.filter((m) => {
    const key = `${m.openPos}:${m.closePos}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchKey(m: EmphasisMatch): string {
  return `${m.openPos}:${m.closePos}:${m.useDelims}`;
}

function totalUsedDelims(
  matches: readonly EmphasisMatch[],
  pos: number,
  orig: number,
  side: "open" | "close",
): number {
  return matches
    .filter((m) =>
      side === "open"
        ? m.openPos === pos && m.openOrig === orig
        : m.closePos === pos && m.closeOrig === orig,
    )
    .reduce((sum, m) => sum + m.useDelims, 0);
}

function stitchConsumed(
  m: EmphasisMatch,
  allMatches: readonly EmphasisMatch[],
): { open: [number, number]; close: [number, number]; end: number } {
  const openUsed = totalUsedDelims(allMatches, m.openPos, m.openOrig, "open");
  const closeUsed = totalUsedDelims(allMatches, m.closePos, m.closeOrig, "close");
  return {
    open: [m.openPos + m.openOrig - openUsed, m.openPos + m.openOrig],
    close: [m.closePos, m.closePos + closeUsed],
    end: m.closePos + closeUsed,
  };
}

function buildInnerNodes(
  src: string,
  m: EmphasisMatch,
  matches: EmphasisMatch[],
  parts: ScannedPart[],
  consumed: [number, number][],
  parseInline: (text: string) => MarkdownNode[],
): MarkdownNode[] {
  const innerLo = m.openPos + m.openOrig;
  const innerHi = m.closePos;
  const nested = topLevelMatches(
    matchesInSpan(matches, innerLo, innerHi).filter(
      (child) => child !== m && contains(m, child),
    ),
  );
  const nestable = nested.filter((child) => shouldNestChild(m, child, src));
  const marker = src[m.openPos];

  if (nestable.length > 0) {
    return stitch(
      src,
      innerLo,
      innerHi,
      nestable,
      parts,
      consumed,
      parseInline,
      matches,
    );
  }

  let inner = src.slice(innerLo, innerHi);
  if (m.useDelims >= 2) {
    inner = inner.replaceAll(marker.repeat(m.useDelims), "");
  }
  return parseInline(inner);
}

function materialize(
  src: string,
  lo: number,
  hi: number,
  parts: ScannedPart[],
  consumed: readonly [number, number][],
): MarkdownNode[] {
  const out: MarkdownNode[] = [];

  for (const part of parts) {
    if (part.end <= lo || part.start >= hi) continue;

    if (part.node.type !== "text") {
      if (part.start >= lo && part.end <= hi) out.push(part.node);
      continue;
    }

    const segLo = Math.max(lo, part.start);
    const segHi = Math.min(hi, part.end);
    let text = "";
    for (let i = segLo; i < segHi; i++) {
      if (consumed.some(([s, e]) => i >= s && i < e)) continue;
      text += src[i];
    }
    if (text) out.push(createNode("text", text.length, text));
  }

  return out;
}

function stitch(
  src: string,
  lo: number,
  hi: number,
  matches: EmphasisMatch[],
  parts: ScannedPart[],
  consumed: [number, number][],
  parseInline: (text: string) => MarkdownNode[],
  allMatches: readonly EmphasisMatch[] = matches,
): MarkdownNode[] {
  const inRange = uniqueTopLevel(matchesActiveInSpan(matches, lo, hi)).sort((a, b) => {
    if (a.openPos !== b.openPos) return a.openPos - b.openPos;
    if (a.useDelims !== b.useDelims) return a.useDelims - b.useDelims;
    return closeEnd(b) - closeEnd(a);
  });

  if (inRange.length === 0) {
    return materialize(src, lo, hi, parts, consumed);
  }

  const m = inRange[0];
  const { open: openConsumed, close: closeConsumed, end } = stitchConsumed(
    m,
    allMatches,
  );
  const ownsDelims = m.openPos >= lo;
  const type = m.useDelims === 1 ? "emphasis" : "strong";
  const nextConsumed = ownsDelims
    ? [...consumed, openConsumed, closeConsumed]
    : consumed;
  const rest = matches.filter((x) => matchKey(x) !== matchKey(m));
  const innerLo = m.openPos + m.openOrig;
  const innerHi = m.closePos;
  const innerNodes = buildInnerNodes(
    src,
    m,
    allMatches,
    parts,
    nextConsumed,
    parseInline,
  );

  const beforeEnd = Math.max(lo, Math.min(m.openPos, hi));
  const afterStart = ownsDelims ? Math.min(end, hi) : Math.min(m.closePos, hi);
  const spanLen = ownsDelims ? end - m.openPos : innerHi - innerLo;

  const nodes: MarkdownNode[] = [];
  nodes.push(
    ...stitch(src, lo, beforeEnd, rest, parts, nextConsumed, parseInline, allMatches),
  );
  nodes.push(createNode(type, spanLen, undefined, innerNodes));
  nodes.push(
    ...stitch(src, afterStart, hi, rest, parts, nextConsumed, parseInline, allMatches),
  );
  return nodes;
}

export function applyEmphasis(
  parts: ScannedPart[],
  src: string,
  parseInline: (text: string) => MarkdownNode[],
): MarkdownNode[] {
  const excluded = parts
    .filter((p) => p.node.type !== "text")
    .map((p) => [p.start, p.end] as [number, number]);

  const delimiters = collectDelimiters(src, excluded);
  const matches = matchDelimiters(src, delimiters);
  if (matches.length === 0) {
    return parts.map((p) => p.node);
  }

  return stitch(src, 0, src.length, matches, parts, [], parseInline);
}

/** 在 openIndex 处尝试匹配 emphasis/strong（供 GFM emphasis parser 调用） */
export function parseEmphasisAt(
  src: string,
  openIndex: number,
  parts: ScannedPart[],
  parseInline: (text: string) => MarkdownNode[],
): { node: MarkdownNode; nextIndex: number } | null {
  const excluded = parts
    .filter((p) => p.node.type !== "text")
    .map((p) => [p.start, p.end] as [number, number]);

  const matches = matchDelimiters(src, collectDelimiters(src, excluded));
  const candidates = uniqueTopLevel(matchesActiveInSpan(matches, 0, src.length))
    .filter((m) => m.openPos === openIndex)
    .sort((a, b) => {
      if (a.useDelims !== b.useDelims) return a.useDelims - b.useDelims;
      return closeEnd(b) - closeEnd(a);
    });

  if (candidates.length === 0) return null;

  const m = candidates[0];
  const { end } = stitchConsumed(m, matches);
  const type = m.useDelims === 1 ? "emphasis" : "strong";
  const innerNodes = buildInnerNodes(src, m, matches, parts, [], parseInline);
  return {
    node: createNode(type, end - openIndex, undefined, innerNodes),
    nextIndex: end,
  };
}
