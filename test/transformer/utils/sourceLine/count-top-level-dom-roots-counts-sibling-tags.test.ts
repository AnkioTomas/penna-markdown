import { expect, it } from "vitest";
import { countTopLevelDomRoots } from "@/transformer/utils/sourceLine.js";

it("countTopLevelDomRoots counts sibling top-level tags", () => {
  expect(countTopLevelDomRoots("<p>a</p><p>b</p>")).toBe(2);
  expect(countTopLevelDomRoots("<div><span>x</span></div>")).toBe(1);
  expect(countTopLevelDomRoots("")).toBe(0);
});
