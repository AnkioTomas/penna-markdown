import REGISTERED_THEMES from "@/theme/ThemeRegister.js";
import type { ToolbarButtonItem } from "@/editor/toolbar/ToolbarItem";

const THEME_LABELS: Record<string, string> = {
  default: "默认",
  claude: "Claude",
  github: "GitHub",
  morandi: "莫兰迪",
  latex: "LaTeX",
  vue: "Vue",
  notion: "Notion",
};

/** 根据已注册主题生成工具栏主题子菜单项。 */
export function buildThemeMenuItems(
  themeIds?: readonly string[],
): ToolbarButtonItem[] {
  const ids = themeIds ?? REGISTERED_THEMES;
  return ids.map((id) => {
    const label = THEME_LABELS[id] ?? id;
    return {
      id: `theme-${id}`,
      label,
      title: `切换为 ${label} 主题`,
    };
  });
}
