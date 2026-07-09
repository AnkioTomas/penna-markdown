import { expect, it } from "vitest";
import { sanitizeRawHtml } from "@/transformer/utils/safeHtml.js";

it("strips event handlers", () => {
  expect(sanitizeRawHtml('<img src="x" onerror="alert(1)">')).toBe(
    '<img src="x">',
  );
});
