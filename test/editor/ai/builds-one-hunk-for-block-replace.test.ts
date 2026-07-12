import { expect, it } from "vitest";
import { buildHunks } from "@/editor/ai";

it("builds one hunk when a large block is replaced by a few lines", () => {
  const original = Array.from({ length: 100 }, (_, i) => `line${i}`).join("\n");
  const result = "summary one\nsummary two\n";
  const hunks = buildHunks(`${original}\n`, result, 0);

  expect(hunks).toHaveLength(1);
  expect(hunks[0].original).toContain("line0");
  expect(hunks[0].original).toContain("line99");
  expect(hunks[0].result).toBe(result);
});
