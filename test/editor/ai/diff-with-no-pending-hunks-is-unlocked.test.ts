import { expect, it } from "vitest";
import { isAILocked } from "@/editor/ai";

it("diff with no pending hunks is unlocked", () => {
  expect(
    isAILocked({
      phase: "diff",
      hunks: [
        {
          id: "0",
          status: "accepted",
          original: "a",
          result: "b",
          from: 0,
          to: 1,
        },
      ],
    }),
  ).toBe(false);
});
