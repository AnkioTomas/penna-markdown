import type { DiffChunk } from "./diffChars";

function splitLines(text: string): string[] {
  if (!text) return [];
  const parts = text.split("\n");
  return parts.map((line, index) =>
    index < parts.length - 1 ? `${line}\n` : line,
  );
}

/** 行级 diff，基于 LCS */
export function diffLines(a: string, b: string): DiffChunk[] {
  const aLines = splitLines(a);
  const bLines = splitLines(b);
  const m = aLines.length;
  const n = bLines.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array<number>(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (aLines[i - 1] === bLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const raw: DiffChunk[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aLines[i - 1] === bLines[j - 1]) {
      raw.push({ type: "equal", value: aLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      raw.push({ type: "add", value: bLines[j - 1] });
      j--;
    } else {
      raw.push({ type: "del", value: aLines[i - 1] });
      i--;
    }
  }

  raw.reverse();

  const merged: DiffChunk[] = [];
  for (const chunk of raw) {
    const last = merged[merged.length - 1];
    if (last && last.type === chunk.type) {
      last.value += chunk.value;
    } else {
      merged.push({ ...chunk });
    }
  }

  return merged;
}

export type HunkStatus = "pending" | "accepted" | "rejected";

export type DiffHunk = {
  id: string;
  status: HunkStatus;
  original: string;
  result: string;
  from: number;
  to: number;
};

/** 从行级 diff 构建可逐块确认的 hunk 列表（文档已替换为 result） */
export function buildHunks(
  original: string,
  result: string,
  baseFrom: number,
): DiffHunk[] {
  const chunks = diffLines(original, result);
  const hunks: DiffHunk[] = [];
  let docPos = baseFrom;
  let buf: { original: string; result: string; from: number } | null = null;
  let id = 0;

  const flush = () => {
    if (!buf || (!buf.original && !buf.result)) {
      buf = null;
      return;
    }
    hunks.push({
      id: String(id++),
      status: "pending",
      original: buf.original,
      result: buf.result,
      from: buf.from,
      to: buf.from + buf.result.length,
    });
    buf = null;
  };

  for (const chunk of chunks) {
    if (chunk.type === "equal") {
      flush();
      docPos += chunk.value.length;
    } else if (chunk.type === "add") {
      if (!buf) buf = { original: "", result: "", from: docPos };
      buf.result += chunk.value;
      docPos += chunk.value.length;
    } else {
      if (!buf) buf = { original: "", result: "", from: docPos };
      buf.original += chunk.value;
    }
  }

  flush();
  return hunks;
}

export function hasPendingHunks(hunks: DiffHunk[]): boolean {
  return hunks.some((h) => h.status === "pending");
}
