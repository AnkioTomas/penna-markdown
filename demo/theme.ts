import { Theme } from "@/theme/Theme.js";

/** Demo 环境统一开启 Theme 调试日志（主题事件等） */
export function createDemoTheme(): Theme {
  return new Theme(true);
}
