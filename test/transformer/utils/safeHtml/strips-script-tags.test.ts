import { expect, it } from "vitest";
import { sanitizeRawHtml } from "@/transformer/utils/safeHtml.js";

it("strips script tags", () => {
  expect(sanitizeRawHtml("<script>alert(1)</script><p>ok</p>")).toBe(
    "<p>ok</p>",
  );
});
