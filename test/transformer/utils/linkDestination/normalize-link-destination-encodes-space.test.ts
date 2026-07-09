import { expect, it } from "vitest";
import { normalizeLinkDestination } from "@/transformer/utils/linkDestination.js";

it("normalizeLinkDestination encodes spaces and preserves percent sequences", () => {
  expect(normalizeLinkDestination("/a b")).toBe("/a%20b");
  expect(normalizeLinkDestination("/already%20ok")).toBe("/already%20ok");
});
