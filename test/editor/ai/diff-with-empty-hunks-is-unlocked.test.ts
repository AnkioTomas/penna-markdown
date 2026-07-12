import { expect, it } from "vitest";
import { isAILocked } from "@/editor/ai";

it("diff with empty hunks is unlocked", () => {
  expect(isAILocked({ phase: "diff", hunks: [] })).toBe(false);
});
