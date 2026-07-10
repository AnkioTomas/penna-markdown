/**
 * @file 主题皮肤与明暗模式
 * @module theme/Theme
 *
 * 管理 `cherry-theme-*`（皮肤）与 `cherry-dark`（明暗）两类 class，
 * 并通过 {@link EventBus} 广播 {@link THEME_EVENT_SKIN} / {@link THEME_EVENT_LIGHT_DARK}。
 *
 * ## class 分工
 *
 * | 元素 | class | 作用 |
 * | ---- | ----- | ---- |
 * | `rootElement`（用户挂载点） | `cherry-theme-{id}`、`cherry-dark` | 皮肤变量与编辑器 chrome |
 * | 预览挂载点（由调用方标记） | `cherry-render` | 供 `.cherry-theme-* .cherry-render` 命中渲染样式 |
 *
 * Theme 只写 root 上的皮肤 class；`cherry-render` 由 Cherry / Demo HTML 自行挂在预览节点。
 */

import REGISTERED_THEMES from "@/theme/ThemeRegister";
import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";
import {
  LightDark,
  THEME_EVENT_LIGHT_DARK,
} from "@/theme/event/ThemeLightDarkEvent";
import { THEME_EVENT_SKIN } from "@/theme/event/ThemeSkinEvent";

/**
 * 主题状态：皮肤 id + 明暗模式。
 *
 * 不直接操作样式表，仅切换 DOM class 并发出事件，供 Renderer / 编辑器等订阅。
 */
export class Theme {
  /** 当前皮肤 id，对应 `cherry-theme-{id}` */
  private id = "default";
  /** 当前明暗模式 */
  private mode: LightDark = "light";

  /**
   * @param bus          实例级事件总线
   * @param logger       日志门面
   * @param rootElement  用户传入的挂载根，承载 `cherry-theme-*` / `cherry-dark`
   * @param themes       外部注册的皮肤 id 列表，与内置 {@link REGISTERED_THEMES} 合并
   */
  constructor(
    private readonly bus: EventBus,
    private readonly logger: Log,
    private readonly rootElement: HTMLElement,
    private readonly themes: string[] = [],
  ) {}

  /** 可用皮肤 id：内置 + 外部注册 */
  list() {
    return [...REGISTERED_THEMES, ...this.themes];
  }

  /**
   * 切换皮肤；未知 id 时打错误日志并仍写入 id。
   *
   * id 变化时发出 {@link THEME_EVENT_SKIN}。
   *
   * @param id 皮肤 id，须出现在 {@link list} 中
   */
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

  /** 当前主题快照：id、mode、isDark 及 DOM 引用 */
  getTheme() {
    return {
      id: this.id,
      mode: this.mode,
      isDark: this.mode === "dark",
      root: this.rootElement,
    };
  }

  /**
   * 切换明暗模式；相同时 no-op。
   *
   * 发出 {@link THEME_EVENT_LIGHT_DARK}。
   *
   * @param mode `light` | `dark`
   */
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

  /** 同步皮肤 class：仅 {@link rootElement}，不写 `cherry-render` */
  private applyThemeClasses() {
    for (const name of [...this.rootElement.classList]) {
      if (name.startsWith("cherry-theme-")) {
        this.rootElement.classList.remove(name);
      }
    }

    this.rootElement.classList.add(`cherry-theme-${this.id}`);
  }

  /** 同步明暗 class：`cherry-dark` 仅挂在 {@link rootElement} */
  private applyAppearanceClass() {
    this.rootElement.classList.toggle("cherry-dark", this.mode === "dark");
  }
}
