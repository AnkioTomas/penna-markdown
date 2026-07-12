import { expect, it } from "vitest";
import { isAILocked } from "@/editor/ai";

it("diff with pending hunks is locked", () => {
  expect(
    isAILocked({
      phase: "diff",
      hunks: [
        {
          id: "0",
          status: "pending",
          original: "a",
          result: "b",
          from: 0,
          to: 1,
        },
      ],
    }),
  ).toBe(true);
});
