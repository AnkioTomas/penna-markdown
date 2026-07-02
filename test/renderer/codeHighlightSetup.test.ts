import { describe, expect, it, vi } from "vitest";
import {
  getCherryCodeHighlightLoader,
  registerCherryCodeHighlightLoader,
  setupCherryCodeHighlight,
} from "@/renderer/highlight/setup.js";

describe("renderer/codeHighlight setup", () => {
  it("registers highlight callback via setupCherryCodeHighlight", async () => {
    const highlight = vi.fn(async () => "<span>ok</span>");
    setupCherryCodeHighlight({ highlight });

    const load = getCherryCodeHighlightLoader();
    expect(load).toBeTypeOf("function");

    const adapter = await load!();
    const html = await adapter.highlight("const a = 1", "js", { dark: false, panel: null });
    expect(highlight).toHaveBeenCalled();
    expect(html).toBe("<span>ok</span>");
  });

  it("registers custom load via setupCherryCodeHighlight", async () => {
    const load = vi.fn(async () => ({
      highlight: async () => "x",
    }));
    setupCherryCodeHighlight({ load });

    const adapter = await getCherryCodeHighlightLoader()!();
    expect(load).toHaveBeenCalled();
    expect(await adapter.highlight("a", "", { dark: false, panel: null })).toBe("x");
  });

  it("allows registerCherryCodeHighlightLoader override", async () => {
    registerCherryCodeHighlightLoader(async () => ({
      highlight: async () => "manual",
    }));
    const adapter = await getCherryCodeHighlightLoader()!();
    expect(await adapter.highlight("a", "", { dark: false, panel: null })).toBe("manual");
  });
});
