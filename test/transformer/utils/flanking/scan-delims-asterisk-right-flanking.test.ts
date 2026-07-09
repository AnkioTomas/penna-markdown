import { expect, it } from "vitest";
import { scanDelims } from "@/transformer/utils/flanking.js";

it("scanDelims treats asterisk as open and close when flanking", () => {
  expect(scanDelims("*foo*", 0, "*")).toEqual({
    numdelims: 1,
    canOpen: true,
    canClose: false,
  });
  expect(scanDelims("*foo*", 4, "*")).toEqual({
    numdelims: 1,
    canOpen: false,
    canClose: true,
  });
});
