import { expect, it } from "vitest";
import { sanitizeRawHtml } from "@/transformer/utils/safeHtml.js";

it("keeps safe markup", () => {
  expect(sanitizeRawHtml('<div class="note">hello</div>')).toBe(
    '<div class="note">hello</div>',
  );
});
