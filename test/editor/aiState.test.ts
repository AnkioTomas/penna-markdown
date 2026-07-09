import { describe, expect, it } from "vitest";
import { isAILocked } from "@/editor/ai/aiState";

describe("isAILocked", () => {
  it("idle is unlocked", () => {
    expect(isAILocked({ phase: "idle" })).toBe(false);
  });

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

  it("diff with empty hunks is unlocked", () => {
    expect(isAILocked({ phase: "diff", hunks: [] })).toBe(false);
  });
});
