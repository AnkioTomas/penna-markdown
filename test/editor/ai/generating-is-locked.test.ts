import { expect, it } from "vitest";
import { isAILocked } from "@/editor/ai";

it("generating is locked", () => {
  expect(
    isAILocked({
      phase: "generating",
      from: 0,
      to: 1,
      original: "a",
      genId: 1,
      action: "polish",
    }),
  ).toBe(true);
});
