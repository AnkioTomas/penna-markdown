import { EventBus, type EventHandler } from "./event/EventBus.js";
import REGISTERED_THEMES from "./ThemeRegister.js";

export type LightDark = "light" | "dark";

export class Theme {
  private bus = new EventBus();
  private id = "default";
  private mode: LightDark = "light";
  private render: HTMLElement | null = null;
  private root: HTMLElement | null = null;

  list() {
    return REGISTERED_THEMES;
  }

  setTheme(id: string, render: HTMLElement, root?: HTMLElement) {
    if (!REGISTERED_THEMES.includes(id as (typeof REGISTERED_THEMES)[number])) {
      throw new Error(`未知主题: ${id}`);
    }

    const prev = this.id;
    this.id = id;
    this.render = render;
    this.root = root ?? render.parentElement ?? render;

    this.applyThemeClasses();
    this.applyAppearanceClass();

    if (prev !== id) {
      this.emit("theme:skin", { prev, id, render });
    }
  }

  getTheme() {
    return {
      id: this.id,
      mode: this.mode,
      isDark: this.mode === "dark",
      render: this.render,
      root: this.root,
    };
  }

  setLightDark(mode: LightDark) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.applyAppearanceClass();
    this.emit("theme:ld", { mode, isDark: mode === "dark" });
  }

  on(event: string, handler: EventHandler) {
    return this.bus.on(event, handler);
  }

  off(event: string, handler: EventHandler) {
    this.bus.off(event, handler);
  }

  emit(event: string, payload?: unknown) {
    this.bus.emit(event, payload);
  }

  /** 主题 class 在 root；render 仅 cherry-render（供 `.cherry-theme-* .cherry-render` 命中） */
  private applyThemeClasses() {
    if (!this.render) return;

    this.render.classList.add("cherry-render");
    for (const name of [...this.render.classList]) {
      if (name.startsWith("cherry-theme-")) this.render.classList.remove(name);
    }

    const themeRoot = this.root ?? this.render;
    for (const name of [...themeRoot.classList]) {
      if (name.startsWith("cherry-theme-")) themeRoot.classList.remove(name);
    }
    themeRoot.classList.add(`cherry-theme-${this.id}`);
  }

  private applyAppearanceClass() {
    this.root?.classList.toggle("cherry-dark", this.mode === "dark");
    this.render?.classList.remove("cherry-dark");
  }
}
