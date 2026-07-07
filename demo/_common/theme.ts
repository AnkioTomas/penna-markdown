import { Cherry } from "@/editor/Cherry.js";
import {
  Theme,
  THEME_EVENT_LIGHT_DARK,
  THEME_EVENT_SKIN,
} from "@/theme/Theme.js";
import REGISTERED_THEMES from "@/theme/ThemeRegister.js";

/** 独立模块 Demo（渲染器 / 转换器）统一开启 Theme 调试日志 */
export function createDemoTheme(): Theme {
  return new Theme(true);
}

const THEME_STORAGE_KEY = "cherry-demo-theme";
const APPEARANCE_STORAGE_KEY = "cherry-demo-appearance";

type AppearanceMode = "light" | "dark" | "auto";

function readAppearance(): AppearanceMode {
  return (localStorage.getItem(APPEARANCE_STORAGE_KEY) as AppearanceMode) || "light";
}

function resolveAppearance(mode: AppearanceMode): "light" | "dark" {
  if (mode === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function readThemeId(): string {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  return saved && (REGISTERED_THEMES as readonly string[]).includes(saved) ? saved : "default";
}

export interface ThemeControlOptions {
  /** 主题/明暗变化后回调（用于独立 Renderer 重新渲染） */
  onThemeChange?: () => void;
}

/** 编辑器 Demo：主题 + 明暗切换 */
export function setupThemeAndAppearance(editor: Cherry, options: ThemeControlOptions = {}): void {
  bindThemeControls(editor.theme, () => editor.theme.getTheme(), options);
}

/**
 * 独立预览 Demo（语法演示 / 框架集成等）：绑定 Theme 到挂载点并接入顶栏控件。
 */
export function setupPreviewThemeAndAppearance(
  theme: Theme,
  render: HTMLElement,
  root: HTMLElement,
  options: ThemeControlOptions = {},
): void {
  theme.setTheme(readThemeId(), render, root);
  bindThemeControls(theme, () => theme.getTheme(), options);
}

function bindThemeControls(
  theme: Theme,
  getSnapshot: () => ReturnType<Theme["getTheme"]>,
  options: ThemeControlOptions,
): void {
  const themeSelect = document.getElementById("theme-select") as HTMLSelectElement | null;
  const appearanceSelect = document.getElementById("appearance-select") as HTMLSelectElement | null;

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
      const { render, root } = getSnapshot();
      if (render && root) {
        theme.setTheme(next, render, root);
        localStorage.setItem(THEME_STORAGE_KEY, next);
      }
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

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (currentAppearance === "auto") applyAppearance();
  });

  theme.on(THEME_EVENT_SKIN, () => options.onThemeChange?.());
  theme.on(THEME_EVENT_LIGHT_DARK, () => options.onThemeChange?.());

  const { render, root } = getSnapshot();
  if (render && root) theme.setTheme(readThemeId(), render, root);
  applyAppearance();
}
