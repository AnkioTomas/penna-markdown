import { ICON_THEME } from "@/editor/toolbar/icons";
import REGISTERED_THEMES from "@/theme/ThemeRegister.js";

export const THEME_LABELS: Record<string, string> = {
  default: "默认",
  claude: "Claude",
  github: "GitHub",
  morandi: "莫兰迪",
  latex: "LaTeX",
  vue: "Vue",

  notion: "Notion",
};

export function buildThemeMenuItems() {
  return REGISTERED_THEMES.map((id) => ({
    id: `theme-${id}`,
    label: THEME_LABELS[id] ?? id,
    title: `切换为 ${THEME_LABELS[id] ?? id} 主题`,
    command: "setTheme",
    payload: { id },
    icon: ICON_THEME,
  }));
}
