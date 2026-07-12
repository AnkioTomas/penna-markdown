import { expect, it } from "vitest";
import { buildHunks } from "@/editor/ai";

it("builds multiple hunks", () => {
  const original = "a\nb\nc\nd\n";
  const result = "a\nB\nc\nD\n";
  const hunks = buildHunks(original, result, 10);
  expect(hunks.length).toBeGreaterThanOrEqual(2);
  expect(hunks[0].from).toBeGreaterThanOrEqual(10);
});
