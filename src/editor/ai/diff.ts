export type DiffChunk = { type: "equal" | "add" | "del"; value: string };

type DiffMode = "char" | "line";

/**
 * 将文本拆分为 diff 单元：字符或保留换行符的行片段。
 */
function splitUnits(text: string, mode: DiffMode): string[] {
  if (mode === "char") return [...text];
  if (!text) return [];
  const parts = text.split("\n");
  return parts.map((line, index) =>
    index < parts.length - 1 ? `${line}\n` : line,
  );
}

/**
 * 基于最长公共子序列计算文本差异。
 */
function diffText(a: string, b: string, mode: DiffMode): DiffChunk[] {
  const aUnits = splitUnits(a, mode);
  const bUnits = splitUnits(b, mode);
  const m = aUnits.length;
  const n = bUnits.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array<number>(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (aUnits[i - 1] === bUnits[j - 1]) {
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
    if (i > 0 && j > 0 && aUnits[i - 1] === bUnits[j - 1]) {
      raw.push({ type: "equal", value: aUnits[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      raw.push({ type: "add", value: bUnits[j - 1] });
      j--;
    } else {
      raw.push({ type: "del", value: aUnits[i - 1] });
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

/** 字符级差异 */
export function diffChars(a: string, b: string): DiffChunk[] {
  return diffText(a, b, "char");
}

/** 行级差异 */
export function diffLines(a: string, b: string): DiffChunk[] {
  return diffText(a, b, "line");
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

/**
 * 从行级差异构建可逐块确认的差异块；调用时文档已替换为结果文本。
 * 一块连续变更（中间无未改行）合并为一个 hunk，整块只需一次接受/拒绝。
 */
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

/** 差异块列表中是否仍有待确认项 */
export function hasPendingHunks(hunks: DiffHunk[]): boolean {
  return hunks.some((h) => h.status === "pending");
}
