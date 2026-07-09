import { expect, it } from "vitest";
import { parsePlainDestination } from "@/transformer/utils/linkDestination.js";

it("parsePlainDestination stops at whitespace and balances parentheses", () => {
  expect(parsePlainDestination("/path(to)", 0)).toEqual({
    href: "/path(to)",
    next: 9,
  });
  expect(parsePlainDestination("/a b", 0)).toEqual({
    href: "/a",
    next: 2,
  });
});
