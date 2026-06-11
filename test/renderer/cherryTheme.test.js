import { describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import {
  CHERRY_THEME_CHANGE_EVENT,
  dispatchCherryThemeChange,
  isCherryDarkMode,
  watchCherryTheme,
} from "@/renderer/cherryTheme.js";
import { resetCherryCodeHighlightTheme } from "@/renderer/codeHighlight.js";

describe("renderer/cherryTheme", () => {
  it("detects dark mode from data-theme ancestor", () => {
    const dom = new JSDOM(
      '<div data-theme="dark"><div class="cherry" id="root"></div></div>',
    );
    const root = dom.window.document.getElementById("root");
    expect(isCherryDarkMode(root)).toBe(true);
  });

  it("resetCherryCodeHighlightTheme clears highlight cache", () => {
    const dom = new JSDOM(`
      <div class="cherry">
        <code data-cherry-code data-cherry-highlighted="1" data-cherry-highlight-theme="light"></code>
      </div>
    `);
    const mount = dom.window.document.querySelector(".cherry");
    const code = mount.querySelector("code");
    resetCherryCodeHighlightTheme(mount);
    expect(code.dataset.cherryHighlighted).toBeUndefined();
    expect(code.dataset.cherryHighlightTheme).toBeUndefined();
  });

  it("watchCherryTheme reacts to data-theme mutation", async () => {
    const dom = new JSDOM('<html><body><div class="cherry" id="root"></div></body></html>');
    const { document, MutationObserver } = dom.window;
    globalThis.MutationObserver = MutationObserver;

    const root = document.getElementById("root");
    const onChange = vi.fn();
    const unwatch = watchCherryTheme(root, onChange);

    document.documentElement.setAttribute("data-theme", "dark");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onChange).toHaveBeenCalled();

    unwatch();
  });

  it("dispatchCherryThemeChange triggers watchCherryTheme", () => {
    const dom = new JSDOM('<html><body><div class="cherry" id="root"></div></body></html>');
    const { document, MutationObserver, CustomEvent } = dom.window;
    globalThis.MutationObserver = MutationObserver;
    globalThis.CustomEvent = CustomEvent;

    const root = document.getElementById("root");
    const onChange = vi.fn();
    const unwatch = watchCherryTheme(root, onChange);

    dispatchCherryThemeChange(document.documentElement);
    expect(onChange).toHaveBeenCalled();

    unwatch();
    expect(CHERRY_THEME_CHANGE_EVENT).toBe("cherry-theme-change");
  });
});
