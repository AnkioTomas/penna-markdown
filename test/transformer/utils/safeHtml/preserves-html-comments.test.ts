import { expect, it } from "vitest";
import { sanitizeRawHtml } from "@/transformer/utils/safeHtml.js";

it("preserves HTML comments", () => {
  expect(sanitizeRawHtml("<!-- secret --><p>ok</p>")).toBe(
    "<!-- secret --><p>ok</p>",
  );
});
