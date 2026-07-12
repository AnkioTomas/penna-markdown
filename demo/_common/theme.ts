import { Cherry } from "@/editor/Cherry.js";
import { Theme } from "@/theme/Theme.js";
import { EventBus } from "@/core/event/EventBus.js";
import { Log } from "@/core/Log.js";
import { THEME_EVENT_LIGHT_DARK } from "@/theme/event/ThemeLightDarkEvent.js";
import { THEME_EVENT_SKIN } from "@/theme/event/ThemeSkinEvent.js";
import REGISTERED_THEMES from "@/theme/ThemeRegister.js";

/** 独立模块 Demo 的 Theme + EventBus + Log 组合 */
export interface DemoThemeKit {
  theme: Theme;
  eventBus: EventBus;
  log: Log;
}

const THEME_STORAGE_KEY = "cherry-demo-theme";
const APPEARANCE_STORAGE_KEY = "cherry-demo-appearance";

type AppearanceMode = "light" | "dark" | "auto";

function readAppearance(): AppearanceMode {
  return (
    (localStorage.getItem(APPEARANCE_STORAGE_KEY) as AppearanceMode) || "light"
  );
}

function resolveAppearance(mode: AppearanceMode): "light" | "dark" {
  if (mode === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return mode;
}

function readThemeId(): string {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  return saved && (REGISTERED_THEMES as readonly string[]).includes(saved)
    ? saved
    : "default";
}

/**
 * 创建独立预览 Demo 用的 Theme 套件。
 * @param rootElement 承载 `cherry-theme-*` 的根节点（通常为预览外层容器）
 */
export function createDemoTheme(
  rootElement: HTMLElement = document.body,
): DemoThemeKit {
  const log = new Log(true);
  const eventBus = new EventBus(true, "[cherry-demo]", log);
  const theme = new Theme(eventBus, log, rootElement);
  return { theme, eventBus, log };
}

export interface ThemeControlOptions {
  /** 主题/明暗变化后回调（用于独立 Renderer 重新渲染） */
  onThemeChange?: () => void;
}

/** 编辑器 Demo：主题 + 明暗切换 */
export function setupThemeAndAppearance(
  editor: Cherry,
  options: ThemeControlOptions = {},
): void {
  bindThemeControls(
    { theme: editor.theme, eventBus: editor.eventBus, log: new Log(true) },
    options,
  );
}

/**
 * 独立预览 Demo（语法演示 / 框架集成等）：绑定 Theme 到挂载点并接入顶栏控件。
 * @param kit `createDemoTheme(root)` 返回值
 * @param render 预览内容挂载点（调用方需保证其或其子节点带 `cherry-render`）
 */
export function setupPreviewThemeAndAppearance(
  kit: DemoThemeKit,
  render: HTMLElement,
  options: ThemeControlOptions = {},
): void {
  render.classList.add("cherry-render");
  kit.theme.setTheme(readThemeId());
  bindThemeControls(kit, options);
}

function bindThemeControls(
  kit: DemoThemeKit,
  options: ThemeControlOptions,
): void {
  const { theme, eventBus } = kit;

  const themeSelect = document.getElementById(
    "theme-select",
  ) as HTMLSelectElement | null;
  const appearanceSelect = document.getElementById(
    "appearance-select",
  ) as HTMLSelectElement | null;

  let currentAppearance = readAppearance();

  function applyAppearance(): void {
    theme.setLightDark(resolveAppearance(currentAppearance));
    document.body.classList.toggle("demo-dark", theme.getTheme().isDark);
    options.onThemeChange?.();
  }

  if (themeSelect) {
    themeSelect.replaceChildren(
      ...REGISTERED_THEMES.map((id) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = id.charAt(0).toUpperCase() + id.slice(1);
        return option;
      }),
    );
    themeSelect.value = readThemeId();
    themeSelect.addEventListener("change", () => {
      const next = themeSelect.value;
      theme.setTheme(next);
      localStorage.setItem(THEME_STORAGE_KEY, next);
      options.onThemeChange?.();
    });
  }

  if (appearanceSelect) {
    appearanceSelect.value = currentAppearance;
    appearanceSelect.addEventListener("change", () => {
      currentAppearance = appearanceSelect.value as AppearanceMode;
      localStorage.setItem(APPEARANCE_STORAGE_KEY, currentAppearance);
      applyAppearance();
    });
  }

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (currentAppearance === "auto") applyAppearance();
    });

  eventBus.on(THEME_EVENT_SKIN, () => options.onThemeChange?.());
  eventBus.on(THEME_EVENT_LIGHT_DARK, () => options.onThemeChange?.());

  theme.setTheme(readThemeId());
  applyAppearance();
}
