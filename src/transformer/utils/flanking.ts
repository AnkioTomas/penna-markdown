/**
 * @file GFM 定界符 flanking 规则
 * @module transformer/utils/flanking
 */

import { isEscaped } from "@/transformer/utils/escape.js";
import { isUnicodeWhitespace } from "@/transformer/utils/normalize.js";

function isUnicodePunctuation(ch: string): boolean {
  return ch !== "" && /\p{P}/u.test(ch);
}

function boundaryBefore(src: string, pos: number): string {
  return pos <= 0 ? "\n" : src[pos - 1];
}

function boundaryAfter(src: string, pos: number): string {
  return pos >= src.length ? "\n" : src[pos];
}

export interface DelimScan {
  numdelims: number;
  canOpen: boolean;
  canClose: boolean;
}

/** 扫描 `*` / `_` 定界符串（CommonMark scanDelims） */
export function scanDelims(
  src: string,
  pos: number,
  marker: "*" | "_",
): DelimScan | null {
  if (src[pos] !== marker) return null;
  if (isEscaped(src, pos)) return null;

  let numdelims = 0;
  let i = pos;
  while (src[i] === marker) {
    numdelims += 1;
    i += 1;
  }

  const before = boundaryBefore(src, pos);
  const after = boundaryAfter(src, i);
  const afterIsWhitespace = isUnicodeWhitespace(after);
  const afterIsPunctuation = isUnicodePunctuation(after);
  const beforeIsWhitespace = isUnicodeWhitespace(before);
  const beforeIsPunctuation = isUnicodePunctuation(before);

  const leftFlanking =
    !afterIsWhitespace &&
    (!afterIsPunctuation || beforeIsWhitespace || beforeIsPunctuation);
  const rightFlanking =
    !beforeIsWhitespace &&
    (!beforeIsPunctuation || afterIsWhitespace || afterIsPunctuation);

  let canOpen: boolean;
  let canClose: boolean;
  if (marker === "_") {
    canOpen = leftFlanking && (!rightFlanking || beforeIsPunctuation);
    canClose = rightFlanking && (!leftFlanking || afterIsPunctuation);
  } else {
    canOpen = leftFlanking;
    canClose = rightFlanking;
  }

  return { numdelims, canOpen, canClose };
}
