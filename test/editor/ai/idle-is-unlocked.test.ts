import { expect, it } from "vitest";
import { isAILocked } from "@/editor/ai/aiState";

it("idle is unlocked", () => {
  expect(isAILocked({ phase: "idle" })).toBe(false);
});
