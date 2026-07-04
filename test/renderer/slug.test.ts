import { describe, expect, it } from "vitest";
import { assignSlug, createSlugRegistry, slugify } from "@/transformer/gfm/block/atx_heading.js";

describe("transformer/atx_heading slug", () => {
  it("replaces illegal characters with dashes", () => {
    expect(slugify("Hello, World!")).toBe("Hello-World");
    expect(slugify("  标题：测试  ")).toBe("标题-测试");
  });

  it("deduplicates slugs in document order", () => {
    const used = createSlugRegistry();
    expect(assignSlug("Intro", used)).toBe("Intro");
    expect(assignSlug("Intro", used)).toBe("Intro-1");
    expect(assignSlug("Intro", used)).toBe("Intro-2");
  });

  it("falls back when text is empty", () => {
    expect(slugify("   ")).toBe("heading");
  });
});
