import { EventBus, type EventHandler } from "./event/EventBus.js";
import { logD as emitLogD, logE as emitLogE, logW as emitLogW } from "./log.js";
import REGISTERED_THEMES from "./ThemeRegister.js";

export type LightDark = "light" | "dark";

const LOG_PREFIX = "[cherry]";

export class Theme {
  private bus = new EventBus();
  private id = "default";
  private mode: LightDark = "light";
  private render: HTMLElement | null = null;
  private root: HTMLElement | null = null;

  constructor(private readonly  debug = false) {}

  /** 是否处于调试模式 */
  isDebug(): boolean {
    return this.debug;
  }

  /** 调试日志；非调试模式不输出 */
  logD(...args: unknown[]): void {
    if (!this.debug) return;
    emitLogD(LOG_PREFIX, ...args);
  }

  /** 警告日志 */
  logW(...args: unknown[]): void {
    emitLogW(LOG_PREFIX, ...args);
  }

  /** 错误日志 */
  logE(...args: unknown[]): void {
    emitLogE(LOG_PREFIX, ...args);
  }

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
      this.logD("setTheme", { prev, id });
      this.emit("change", { prev, id, render });
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
    this.logD("setLightDark", { mode });
    this.emit("appearance", { mode, isDark: mode === "dark" });
    this.emit("theme:ld", { mode, isDark: mode === "dark" });
  }

  on(event: string, handler: EventHandler) {
    this.logD("on", event);
    return this.bus.on(event, handler);
  }

  off(event: string, handler: EventHandler) {
    this.logD("off", event);
    this.bus.off(event, handler);
  }

  emit(event: string, payload?: unknown) {
    this.logD("emit", event, payload);
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
