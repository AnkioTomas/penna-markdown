import { expect, it } from "vitest";
import { lineIndexAtPos } from "@/transformer/utils/markdownLines.js";

it("lineIndexAtPos counts preceding newline characters", () => {
  expect(lineIndexAtPos("a\nb\nc", 3)).toBe(1);
  expect(lineIndexAtPos("a\nb\nc", 0)).toBe(0);
});
