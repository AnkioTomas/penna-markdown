import { Cherry } from "@/editor/Cherry.js";
import REGISTERED_THEMES from "@/theme/ThemeRegister.js";

const THEME_STORAGE_KEY = "cherry-demo-theme";
const APPEARANCE_STORAGE_KEY = "cherry-demo-appearance";

type AppearanceMode = "light" | "dark" | "auto";

export function setupThemeAndAppearance(editor: Cherry) {
  const themeSelect = document.getElementById("theme-select") as HTMLSelectElement | null;
  const appearanceSelect = document.getElementById("appearance-select") as HTMLSelectElement | null;

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

  let currentAppearance = readAppearance();
  
  if (themeSelect) {
    themeSelect.replaceChildren(
      ...REGISTERED_THEMES.map((id) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = id.charAt(0).toUpperCase() + id.slice(1);
        return option;
      })
    );
    themeSelect.value = readThemeId();
    themeSelect.addEventListener("change", () => {
      const next = themeSelect.value;
      const { render, root } = editor.theme.getTheme();
      if (render && root) {
        editor.theme.setTheme(next, render, root);
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

  function applyAppearance() {
    editor.theme.setLightDark(resolveAppearance(currentAppearance));
    document.body.classList.toggle("demo-dark", editor.theme.getTheme().isDark);
  }

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (currentAppearance === "auto") applyAppearance();
  });

  // Init
  const initialTheme = readThemeId();
  const { render, root } = editor.theme.getTheme();
  if (render && root) editor.theme.setTheme(initialTheme, render, root);
  applyAppearance();
}
