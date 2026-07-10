import REGISTERED_THEMES from "@/theme/ThemeRegister";
import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";
import {
  LightDark,
  THEME_EVENT_LIGHT_DARK,
} from "@/theme/event/ThemeLightDarkEvent";
import { THEME_EVENT_SKIN } from "@/theme/event/ThemeSkinEvent";

export class Theme {
  private id = "default";
  private mode: LightDark = "light";
  private render: HTMLElement | null = null;
  private root: HTMLElement | null = null;

  constructor(
    private readonly bus: EventBus,
    private readonly logger: Log,
    private readonly rootElement: HTMLElement,
    private readonly themes: string[], //外部注册的theme
  ) {}

  list() {
    return [...REGISTERED_THEMES, ...this.themes];
  }

  setTheme(id: string) {
    if (!this.list().includes(id)) {
      this.logger.logE('unknow theme "' + id + '" , skip it');
    }

    const prev = this.id;
    this.id = id;

    this.applyThemeClasses();
    this.applyAppearanceClass();

    if (prev !== id) {
      this.logger.logD("setTheme", { prev, id });
      this.bus.emit(THEME_EVENT_SKIN, {
        prev,
        id,
        root: this.rootElement,
      });
    }
  }

  getTheme() {
    return {
      id: this.id,
      mode: this.mode,
      isDark: this.mode === "dark",
      root: this.root,
    };
  }

  setLightDark(mode: LightDark) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.applyAppearanceClass();
    this.logger.logD("setLightDark", { mode });
    this.bus.emit(THEME_EVENT_LIGHT_DARK, {
      mode,
      isDark: mode === "dark",
    });
  }

  /** 主题 class 在 root；render 仅 cherry-render（供 `.cherry-theme-* .cherry-render` 命中） */
  private applyThemeClasses() {
    if (!this.render) return;

    this.render.classList.add("cherry-render");
    for (const name of [...this.render.classList]) {
      if (name.startsWith("cherry-theme-")) this.render.classList.remove(name);
    }

    for (const name of [...this.rootElement.classList]) {
      if (name.startsWith("cherry-theme-"))
        this.rootElement.classList.remove(name);
    }
    this.rootElement.classList.add(`cherry-theme-${this.id}`);
  }

  private applyAppearanceClass() {
    this.root?.classList.toggle("cherry-dark", this.mode === "dark");
    this.render?.classList.remove("cherry-dark");
  }
}
