import { expect, it } from "vitest";
import { sanitizeRawHtml } from "@/transformer/utils/safeHtml.js";

it("preserves custom tag name casing", () => {
  expect(sanitizeRawHtml("<Warning>\n*bar*\n</Warning>")).toBe(
    "<Warning>\n*bar*\n</Warning>",
  );
});
