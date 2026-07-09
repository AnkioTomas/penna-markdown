import { expect, it } from "vitest";
import { sanitizeRawHtml } from "@/transformer/utils/safeHtml.js";

it("strips javascript: URLs in href", () => {
  expect(sanitizeRawHtml('<a href="javascript:alert(1)">x</a>')).toBe(
    "<a>x</a>",
  );
});
