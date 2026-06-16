import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "@/transformer/utils/escape.js";

describe("sanitizeHtml", () => {
  it("strips script tags", () => {
    expect(sanitizeHtml('<script>alert(1)</script><p>ok</p>')).toBe("<p>ok</p>");
  });

  it("strips event handlers", () => {
    expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).toBe('<img src="x">');
  });

  it("strips javascript: URLs", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe("<a>x</a>");
  });

  it("keeps safe markup", () => {
    expect(sanitizeHtml('<div class="note">hello</div>')).toBe(
      '<div class="note">hello</div>',
    );
  });
});
