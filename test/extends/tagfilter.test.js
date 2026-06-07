import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";
import { applyTagFilter } from "@/transformer/gfm/utils/tagfilter.js";

describe("tagfilter", () => {
  it("applyTagFilter escapes disallowed tags only", () => {
    const input =
      "<strong> <title> <style> <em>\n<blockquote>\n  <xmp> is disallowed.  <XMP> is also disallowed.\n</blockquote>";
    expect(applyTagFilter(input)).toBe(
      "<strong> &lt;title> &lt;style> <em>\n<blockquote>\n  &lt;xmp> is disallowed.  &lt;XMP> is also disallowed.\n</blockquote>",
    );
  });

  it("does not filter allowed tags", () => {
    expect(applyTagFilter("<strong>ok</strong>")).toBe("<strong>ok</strong>");
    expect(applyTagFilter("<stylesheet>")).toBe("<stylesheet>");
  });

  it("Example 652: GFM tagfilter extension", () => {
    const markdown =
      "<strong> <title> <style> <em>\n\n<blockquote>\n  <xmp> is disallowed.  <XMP> is also disallowed.\n</blockquote>\n";
    const without = createTransformer().render(markdown).html;
    expect(without).toContain("<title>");
    expect(without).toContain("<xmp>");

    const withFilter = createTransformerWithExtensions(["tagfilter"]).render(markdown).html;
    expect(withFilter).toBe(
      "<p><strong> &lt;title> &lt;style> <em></p>\n<blockquote>\n  &lt;xmp> is disallowed.  &lt;XMP> is also disallowed.\n</blockquote>\n",
    );
  });

  it("style HTML block passes through without tagfilter", () => {
    const markdown = "<style>p{color:red;}</style>\n*foo*\n";
    const { html } = createTransformer().render(markdown);
    expect(html).toBe("<style>p{color:red;}</style>\n<p><em>foo</em></p>\n");
  });
});
