import { expect, it } from "vitest";
import { parseLinkTitle } from "@/transformer/utils/linkDestination.js";

it("parseLinkTitle supports double-quoted titles with escapes", () => {
  expect(parseLinkTitle('"hello \\"world\\""', 0)).toEqual({
    title: 'hello \\"world\\"',
    next: 17,
    closed: true,
  });
});
