import { expect, it } from "vitest";
import { buildHunks } from "@/editor/ai";

it("builds hunks from line diff", () => {
  const original = "line1\nline2\nline3\n";
  const result = "line1\nline2-mod\nline3\n";
  const hunks = buildHunks(original, result, 0);
  expect(hunks).toHaveLength(1);
  expect(hunks[0].status).toBe("pending");
  expect(hunks[0].original).toContain("line2");
  expect(hunks[0].result).toContain("line2-mod");
});
