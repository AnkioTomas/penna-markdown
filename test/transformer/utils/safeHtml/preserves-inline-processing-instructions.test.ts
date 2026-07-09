import { expect, it } from "vitest";
import { sanitizeRawHtml } from "@/transformer/utils/safeHtml.js";

it("preserves inline processing instructions", () => {
  expect(sanitizeRawHtml("foo <?php echo $a; ?>")).toBe(
    "foo <?php echo $a; ?>",
  );
});
