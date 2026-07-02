/**
 * Demo 共用：highlight.js CDN 高亮配置。
 */
import type { CodeHighlightSetup } from "@/renderer/highlight/setup.js";
import { DEFAULT_HIGHLIGHT_JS_CDN } from "@/renderer/highlight/adapters/highlightjsCdn.js";

export const demoHighlightSetup: CodeHighlightSetup = {
  cdn: DEFAULT_HIGHLIGHT_JS_CDN,
  css: true,
};
