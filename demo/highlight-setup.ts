/**
 * Demo 共用：从 CDN 动态加载 highlight.js 并注册代码高亮。
 */
import { setupCherryCodeHighlight } from "@/renderer/codeHighlight.js";
import { DEFAULT_HIGHLIGHT_JS_CDN } from "@/renderer/adapters/highlightjsCdn.js";

setupCherryCodeHighlight({ cdn: DEFAULT_HIGHLIGHT_JS_CDN });
