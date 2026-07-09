import { expect, it } from "vitest";
import { normalizeLinkRefLabel } from "@/transformer/utils/normalize.js";

it("normalizeLinkRefLabel lowercases and collapses whitespace", () => {
  expect(normalizeLinkRefLabel("  Foo   Bar  ")).toBe("foo bar");
});
