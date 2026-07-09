export type DiffChunk = { type: "equal" | "add" | "del"; value: string };

/** 字符级 diff，基于 LCS */
export function diffChars(a: string, b: string): DiffChunk[] {
  const aChars = [...a];
  const bChars = [...b];
  const m = aChars.length;
  const n = bChars.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array<number>(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (aChars[i - 1] === bChars[j - 1]) {
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
    if (i > 0 && j > 0 && aChars[i - 1] === bChars[j - 1]) {
      raw.push({ type: "equal", value: aChars[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      raw.push({ type: "add", value: bChars[j - 1] });
      j--;
    } else {
      raw.push({ type: "del", value: aChars[i - 1] });
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
