/**
 * Demo 共用：监听主题切换并刷新 Cherry 预览（代码高亮 / Math / Mermaid / ECharts）。
 */
import { watchCherryTheme } from "@/renderer/cherryTheme.js";

watchCherryTheme(document.body);
