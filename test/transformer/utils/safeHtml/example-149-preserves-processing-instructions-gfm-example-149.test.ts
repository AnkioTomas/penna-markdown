import { expect, it } from "vitest";
import { sanitizeRawHtml } from "@/transformer/utils/safeHtml.js";

it("preserves processing instructions (GFM example 149)", () => {
  const md = "<?php\n\n  echo '>';\n\n?>\n";
  expect(sanitizeRawHtml(md)).toBe(md);
});
