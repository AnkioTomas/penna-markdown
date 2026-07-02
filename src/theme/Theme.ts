import { EventBus, type EventHandler } from "./event/EventBus.js";
import REGISTERED_THEMES from "./ThemeRegister.js";

export type LightDark = "light" | "dark";

export class Theme {
  private bus = new EventBus();
  private id = "default";
  private mode: LightDark = "light";
  private render: HTMLElement | null = null;

  list() {
    return REGISTERED_THEMES;
  }

  setTheme(id: string, render: HTMLElement) {
    if (!REGISTERED_THEMES.includes(id as (typeof REGISTERED_THEMES)[number])) {
      throw new Error(`未知主题: ${id}`);
    }

    const prev = this.id;
    this.id = id;
    this.render = render;

    render.classList.add("cherry-render");
    for (const name of [...render.classList]) {
      if (name.startsWith("cherry-theme-")) render.classList.remove(name);
    }
    render.classList.add(`cherry-theme-${id}`);

    if (prev !== id) {
      this.emit("change", { prev, id, render });
    }
  }

  getTheme() {
    return {
      id: this.id,
      mode: this.mode,
      isDark: this.mode === "dark",
      render: this.render,
    };
  }

  setLightDark(mode: LightDark) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.render?.classList.toggle("cherry-dark", mode === "dark");
    this.emit("appearance", { mode, isDark: mode === "dark" });
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
}
