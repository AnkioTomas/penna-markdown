import { describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import { Theme, THEME_EVENT_LIGHT_DARK } from "@/theme/Theme.js";
import { resetCodeHighlight } from "@/renderer/highlight/hljs.js";

describe("Theme + renderer integration", () => {
  it("theme:ld 事件在 setLightDark 后触发", async () => {
    const dom = new JSDOM(`<div id="wrap"><div class="cherry"></div></div>`);
    const wrap = dom.window.document.getElementById("wrap")! as HTMLElement;
    const mount = dom.window.document.querySelector(".cherry")! as HTMLElement;
    const theme = new Theme();
    theme.setTheme("default", mount, wrap);

    const onLightDark = vi.fn();
    theme.on(THEME_EVENT_LIGHT_DARK, onLightDark);

    theme.setLightDark("dark");
    expect(onLightDark).toHaveBeenCalledWith({ mode: "dark", isDark: true });
  });
});

describe("renderer/theme refresh", () => {
  it("resetCodeHighlight", () => {
    const dom = new JSDOM(`
      <div class="cherry-theme-default"><div class="cherry">
        <code data-cherry-code data-cherry-highlighted="1"></code>
      </div></div>
    `);
    resetCodeHighlight(dom.window.document.querySelector(".cherry"));
    const code = dom.window.document.querySelector("code")! as HTMLElement;
    expect(code.dataset.cherryHighlighted).toBeUndefined();
  });
});
