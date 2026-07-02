import { describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import { isDark, watchCherryTheme } from "@/renderer/index.js";
import { resetCherryCodeHighlightTheme } from "@/renderer/highlight/setup.js";

describe("renderer/theme", () => {
  it("isDark", () => {
    const dom = new JSDOM(`
      <div class="cherry-dark"><div class="cherry" id="root"></div></div>
    `);
    expect(isDark(dom.window.document.getElementById("root"))).toBe(true);
  });

  it("resetCherryCodeHighlightTheme", () => {
    const dom = new JSDOM(`
      <div class="cherry-theme-default"><div class="cherry">
        <code data-cherry-code data-cherry-highlighted="1"></code>
      </div></div>
    `);
    const code = dom.window.document.querySelector("code")! as HTMLElement;
    resetCherryCodeHighlightTheme(dom.window.document.querySelector(".cherry"));
    expect(code.dataset.cherryHighlighted).toBeUndefined();
  });

  it("watchCherryTheme on wrapper class change", async () => {
    const dom = new JSDOM(`
      <div class="cherry-theme-default" id="wrap"><div class="cherry" id="root"></div></div>
    `);
    globalThis.MutationObserver = dom.window.MutationObserver;

    const onChange = vi.fn();
    const unwatch = watchCherryTheme(
      dom.window.document.getElementById("root"),
      onChange,
    );

    const wrap = dom.window.document.getElementById("wrap")!;
    wrap.classList.replace("cherry-theme-default", "cherry-dark");
    await new Promise((r) => setTimeout(r, 0));
    expect(onChange).toHaveBeenCalled();
    unwatch();
  });
});
