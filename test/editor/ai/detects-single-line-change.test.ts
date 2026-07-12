import { expect, it } from "vitest";
import { diffLines } from "@/editor/ai";

it("detects single line change", () => {
  const chunks = diffLines("a\nb\nc\n", "a\nB\nc\n");
  expect(chunks.some((c) => c.type === "del" && c.value.includes("b"))).toBe(
    true,
  );
  expect(chunks.some((c) => c.type === "add" && c.value.includes("B"))).toBe(
    true,
  );
});
