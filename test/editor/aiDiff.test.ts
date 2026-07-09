import { describe, expect, it } from "vitest";
import { diffChars } from "@/editor/ai/diffChars";

describe("diffChars", () => {
  it("returns equal for identical strings", () => {
    expect(diffChars("hello", "hello")).toEqual([
      { type: "equal", value: "hello" },
    ]);
  });

  it("detects insertion", () => {
    const chunks = diffChars("abc", "abcd");
    expect(chunks).toContainEqual({ type: "equal", value: "abc" });
    expect(chunks).toContainEqual({ type: "add", value: "d" });
  });

  it("detects deletion", () => {
    const chunks = diffChars("abcd", "abc");
    expect(chunks).toContainEqual({ type: "equal", value: "abc" });
    expect(chunks).toContainEqual({ type: "del", value: "d" });
  });

  it("detects substitution", () => {
    const chunks = diffChars("cat", "cut");
    expect(chunks.some((c) => c.type === "del" && c.value.includes("a"))).toBe(
      true,
    );
    expect(chunks.some((c) => c.type === "add" && c.value.includes("u"))).toBe(
      true,
    );
  });

  it("handles empty strings", () => {
    expect(diffChars("", "")).toEqual([]);
    expect(diffChars("", "hi")).toEqual([{ type: "add", value: "hi" }]);
    expect(diffChars("hi", "")).toEqual([{ type: "del", value: "hi" }]);
  });
});
