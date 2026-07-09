import { describe, expect, it } from "vitest";
import { buildHunks, diffLines } from "@/editor/ai/diffLines";

describe("diffLines", () => {
  it("detects single line change", () => {
    const chunks = diffLines("a\nb\nc\n", "a\nB\nc\n");
    expect(chunks.some((c) => c.type === "del" && c.value.includes("b"))).toBe(
      true,
    );
    expect(chunks.some((c) => c.type === "add" && c.value.includes("B"))).toBe(
      true,
    );
  });

  it("builds hunks from line diff", () => {
    const original = "line1\nline2\nline3\n";
    const result = "line1\nline2-mod\nline3\n";
    const hunks = buildHunks(original, result, 0);
    expect(hunks).toHaveLength(1);
    expect(hunks[0].status).toBe("pending");
    expect(hunks[0].original).toContain("line2");
    expect(hunks[0].result).toContain("line2-mod");
  });

  it("builds multiple hunks", () => {
    const original = "a\nb\nc\nd\n";
    const result = "a\nB\nc\nD\n";
    const hunks = buildHunks(original, result, 10);
    expect(hunks.length).toBeGreaterThanOrEqual(2);
    expect(hunks[0].from).toBeGreaterThanOrEqual(10);
  });

  it("returns no hunks when text is unchanged", () => {
    const text = "same line\n";
    expect(buildHunks(text, text, 0)).toEqual([]);
  });
});
