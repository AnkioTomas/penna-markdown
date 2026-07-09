import { expect, it } from "vitest";
import { scanDelims } from "@/transformer/utils/flanking.js";

it("scanDelims returns null for escaped delimiter", () => {
  expect(scanDelims("\\*", 1, "*")).toBeNull();
});
