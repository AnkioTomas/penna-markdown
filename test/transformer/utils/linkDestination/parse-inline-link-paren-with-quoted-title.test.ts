import { expect, it } from "vitest";
import { parseInlineLinkParen } from "@/transformer/utils/linkDestination.js";

it("parseInlineLinkParen parses href and quoted title", () => {
  expect(parseInlineLinkParen('(/uri "title")', 0)).toEqual({
    href: "/uri",
    title: "title",
    next: 14,
  });
});
