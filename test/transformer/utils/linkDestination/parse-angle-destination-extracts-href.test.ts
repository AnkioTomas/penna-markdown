import { expect, it } from "vitest";
import { parseAngleDestination } from "@/transformer/utils/linkDestination.js";

it("parseAngleDestination extracts href until unescaped closing bracket", () => {
  expect(parseAngleDestination("<https://example.com>", 0)).toEqual({
    href: "https://example.com",
    next: 21,
  });
  expect(parseAngleDestination("<foo\\>bar>", 0)).toEqual({
    href: "foo\\>bar",
    next: 10,
  });
});
