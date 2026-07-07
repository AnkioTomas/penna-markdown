import { describe, expect, it, vi } from "vitest";
import { Theme, THEME_EVENT_SKIN } from "@/theme/Theme.js";

describe("Theme", () => {
  async function createRenderTree() {
    const dom = new (await import("jsdom")).JSDOM(`<div id="root"><div id="render"></div></div>`);
    const root = dom.window.document.getElementById("root")! as HTMLElement;
    const render = dom.window.document.getElementById("render")! as HTMLElement;
    return { root, render };
  }

  it("list / setTheme / getTheme", async () => {
    const { root, render } = await createRenderTree();
    const theme = new Theme();

    expect(theme.list()).toEqual([
      "default",
      "claude",
      "github",
      "morandi",
      "latex",
      "vue",

      "notion",
    ]);

    theme.setTheme("default", render, root);
    expect(render.classList.contains("cherry-render")).toBe(true);
    expect(root.classList.contains("cherry-theme-default")).toBe(true);
    expect(render.classList.contains("cherry-theme-default")).toBe(false);

    theme.setTheme("claude", render, root);
    expect(root.classList.contains("cherry-theme-default")).toBe(false);
    expect(root.classList.contains("cherry-theme-claude")).toBe(true);
    expect(render.classList.contains("cherry-theme-claude")).toBe(false);
    expect(theme.getTheme().id).toBe("claude");

    theme.setTheme("github", render, root);
    expect(root.classList.contains("cherry-theme-claude")).toBe(false);
    expect(root.classList.contains("cherry-theme-github")).toBe(true);
    expect(render.classList.contains("cherry-theme-github")).toBe(false);
    expect(theme.getTheme().id).toBe("github");

    theme.setTheme("morandi", render, root);
    expect(root.classList.contains("cherry-theme-github")).toBe(false);
    expect(root.classList.contains("cherry-theme-morandi")).toBe(true);
    expect(render.classList.contains("cherry-theme-morandi")).toBe(false);
    expect(theme.getTheme().id).toBe("morandi");

    theme.setTheme("latex", render, root);
    expect(root.classList.contains("cherry-theme-morandi")).toBe(false);
    expect(root.classList.contains("cherry-theme-latex")).toBe(true);
    expect(render.classList.contains("cherry-theme-latex")).toBe(false);
    expect(theme.getTheme().id).toBe("latex");

    theme.setTheme("vue", render, root);
    expect(root.classList.contains("cherry-theme-latex")).toBe(false);
    expect(root.classList.contains("cherry-theme-vue")).toBe(true);
    expect(render.classList.contains("cherry-theme-vue")).toBe(false);
    expect(theme.getTheme().id).toBe("vue");

    theme.setTheme("notion", render, root);
    expect(root.classList.contains("cherry-theme-vue")).toBe(false);
    expect(root.classList.contains("cherry-theme-notion")).toBe(true);
    expect(render.classList.contains("cherry-theme-notion")).toBe(false);
    expect(theme.getTheme().id).toBe("notion");
  });

  it("setLightDark toggles cherry-dark on root, not render", async () => {
    const { root, render } = await createRenderTree();
    const theme = new Theme();

    theme.setTheme("default", render, root);
    theme.setLightDark("dark");

    expect(root.classList.contains("cherry-dark")).toBe(true);
    expect(render.classList.contains("cherry-dark")).toBe(false);
    expect(theme.getTheme().isDark).toBe(true);
  });

  it("on / emit / off", async () => {
    const { root, render } = await createRenderTree();
    const theme = new Theme();
    const handler = vi.fn();

    theme.on(THEME_EVENT_SKIN, handler);
    theme.setTheme("default", render, root);
    theme.setTheme("claude", render, root);
    expect(handler).toHaveBeenCalledTimes(1);

    theme.off(THEME_EVENT_SKIN, handler);
    theme.setTheme("default", render, root);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("logD only outputs when debug is enabled", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const quiet = new Theme();
    quiet.logD("hidden");
    quiet.logW("warn");
    quiet.logE("error");
    expect(logSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith("[cherry]", "warn");
    expect(errorSpy).toHaveBeenCalledWith("[cherry]", "error");

    logSpy.mockClear();
    infoSpy.mockClear();
    warnSpy.mockClear();
    errorSpy.mockClear();

    const verbose = new Theme(true);
    expect(verbose.isDebug()).toBe(true);
    verbose.logD("visible");
    verbose.logW("warn2");
    verbose.logE("error2");
    expect(logSpy).toHaveBeenCalledWith("[cherry]", "visible");
    expect(warnSpy).toHaveBeenCalledWith("[cherry]", "warn2");
    expect(errorSpy).toHaveBeenCalledWith("[cherry]", "error2");

    logSpy.mockRestore();
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("logs emit/on/off in debug mode", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { root, render } = await createRenderTree();
    const theme = new Theme(true);
    const handler = vi.fn();

    theme.on(THEME_EVENT_SKIN, handler);
    theme.setTheme("claude", render, root);
    theme.off(THEME_EVENT_SKIN, handler);

    expect(logSpy).toHaveBeenCalledWith("[cherry]", "event:on", THEME_EVENT_SKIN);
    expect(logSpy).toHaveBeenCalledWith("[cherry]", "setTheme", { prev: "default", id: "claude" });
    expect(logSpy).toHaveBeenCalledWith("[cherry]", "event:emit", THEME_EVENT_SKIN, {
      prev: "default",
      id: "claude",
      render,
    });
    expect(logSpy).toHaveBeenCalledWith("[cherry]", "event:off", THEME_EVENT_SKIN);

    logSpy.mockRestore();
  });
});
