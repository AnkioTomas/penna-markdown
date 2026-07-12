import { expect, it } from "vitest";
import { isAILocked } from "@/editor/ai";

it("idle is unlocked", () => {
  expect(isAILocked({ phase: "idle" })).toBe(false);
});
