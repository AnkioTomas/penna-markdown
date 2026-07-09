import { expect, it } from "vitest";
import { parseListMarkerLine } from "@/transformer/utils/tabs.js";

it("parseListMarkerLine detects unordered list marker and content offset", () => {
  const parsed = parseListMarkerLine("- item");
  expect(parsed).toMatchObject({
    ordered: false,
    bulletChar: "-",
    content: "item",
  });
  expect(parsed?.markerColumn).toBe(0);
});
