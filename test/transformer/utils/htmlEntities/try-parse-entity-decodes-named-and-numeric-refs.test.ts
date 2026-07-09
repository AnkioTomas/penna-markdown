import { expect, it } from "vitest";
import { tryParseEntity } from "@/transformer/utils/htmlEntities.js";

it("tryParseEntity decodes named and numeric character references", () => {
  expect(tryParseEntity("&amp;", 0)).toEqual({ value: "&", length: 5 });
  expect(tryParseEntity("&#65;", 0)).toEqual({ value: "A", length: 5 });
  expect(tryParseEntity("&#x41;", 0)).toEqual({ value: "A", length: 6 });
  expect(tryParseEntity("&notanentity;", 0)).toBeNull();
  expect(tryParseEntity("plain", 0)).toBeNull();
});
