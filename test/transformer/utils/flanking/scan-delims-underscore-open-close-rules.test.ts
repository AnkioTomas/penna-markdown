import { expect, it } from "vitest";
import { scanDelims } from "@/transformer/utils/flanking.js";

it("scanDelims applies underscore open/close flanking rules", () => {
  expect(scanDelims("_foo_", 0, "_")).toEqual({
    numdelims: 1,
    canOpen: true,
    canClose: false,
  });
  expect(scanDelims("_foo_", 4, "_")).toEqual({
    numdelims: 1,
    canOpen: false,
    canClose: true,
  });
});
