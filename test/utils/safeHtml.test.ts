import { describe, expect, it } from "vitest";
import { sanitizeRawHtml } from "@/transformer/utils/safeHtml.js";

describe("utils/safeHtml", () => {
  it("strips script tags", () => {
    expect(sanitizeRawHtml('<script>alert(1)</script><p>ok</p>')).toBe("<p>ok</p>");
  });

  it("strips event handlers", () => {
    expect(sanitizeRawHtml('<img src="x" onerror="alert(1)">')).toBe('<img src="x">');
  });

  it("strips javascript: URLs in href", () => {
    expect(sanitizeRawHtml('<a href="javascript:alert(1)">x</a>')).toBe("<a>x</a>");
  });

  it("keeps safe markup", () => {
    expect(sanitizeRawHtml('<div class="note">hello</div>')).toBe(
      '<div class="note">hello</div>',
    );
  });

  it("preserves custom tag name casing", () => {
    expect(sanitizeRawHtml("<Warning>\n*bar*\n</Warning>")).toBe(
      "<Warning>\n*bar*\n</Warning>",
    );
  });

  it("preserves processing instructions (GFM example 149)", () => {
    const md = "<?php\n\n  echo '>';\n\n?>\n";
    expect(sanitizeRawHtml(md)).toBe(md);
  });

  it("preserves inline processing instructions", () => {
    expect(sanitizeRawHtml("foo <?php echo $a; ?>")).toBe("foo <?php echo $a; ?>");
  });

  it("preserves HTML comments", () => {
    expect(sanitizeRawHtml("<!-- secret --><p>ok</p>")).toBe("<!-- secret --><p>ok</p>");
  });
});
