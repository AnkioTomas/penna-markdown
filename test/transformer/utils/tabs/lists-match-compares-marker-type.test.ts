import { expect, it } from "vitest";
import { listsMatch } from "@/transformer/utils/tabs.js";

it("listsMatch compares ordered delimiter and unordered bullet char", () => {
  expect(
    listsMatch(
      { ordered: false, bulletChar: "-" },
      { ordered: false, bulletChar: "-" },
    ),
  ).toBe(true);
  expect(
    listsMatch(
      { ordered: false, bulletChar: "-" },
      { ordered: false, bulletChar: "*" },
    ),
  ).toBe(false);
  expect(
    listsMatch(
      { ordered: true, delimiter: "." },
      { ordered: true, delimiter: "." },
    ),
  ).toBe(true);
  expect(
    listsMatch(
      { ordered: true, delimiter: "." },
      { ordered: true, delimiter: ")" },
    ),
  ).toBe(false);
});
