/**
 * @file 从 CDN 动态加载 highlight.js
 * @module renderer/adapters/highlightjsCdn
 */

import { loadHighlightJsAdapter } from "@/renderer/adapters/highlightjs.js";
import { loadScript, loadStylesheet } from "@/renderer/utils/loadScript.js";

/** highlight.js 官方 CDN 构建（含常用语言） */
export const DEFAULT_HIGHLIGHT_JS_CDN =
  "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/highlight.min.js";

/** 可选主题样式（GitHub 风格） */
export const DEFAULT_HIGHLIGHT_JS_CSS =
  "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/styles/github.min.css";

/**
 * @typedef {import('../codeHighlight.js').CodeHighlightAdapter} CodeHighlightAdapter
 */

/**
 * @param {Window} win
 * @returns {import('highlight.js').default | undefined}
 */
function readGlobalHljs(win) {
  return win.hljs;
}

/**
 * 从 CDN 加载 highlight.js 并返回 Cherry 适配器。
 *
 * @param {Object} [options]
 * @param {string} [options.cdn] - 脚本 URL；默认 {@link DEFAULT_HIGHLIGHT_JS_CDN}
 * @param {string} [options.css] - 主题 CSS URL；传 `false` 跳过；默认不加载（Cherry 自带 token 色）
 * @param {typeof import('highlight.js').default} [options.hljs] - 已存在的 hljs 实例
 * @param {(hljs: typeof import('highlight.js').default) => void | Promise<void>} [options.register]
 * @returns {Promise<CodeHighlightAdapter>}
 */
export async function loadHighlightJsFromCdn(options = {}) {
  const scriptUrl = options.cdn ?? DEFAULT_HIGHLIGHT_JS_CDN;
  const cssOption = options.css;

  if (cssOption && cssOption !== false) {
    await loadStylesheet(cssOption === true ? DEFAULT_HIGHLIGHT_JS_CSS : cssOption);
  }

  let hljs = options.hljs;
  if (!hljs && typeof window !== "undefined") {
    hljs = readGlobalHljs(window);
  }

  if (!hljs) {
    await loadScript(scriptUrl);
    if (typeof window !== "undefined") {
      hljs = readGlobalHljs(window);
    }
  }

  if (!hljs) {
    throw new Error("highlight.js CDN 加载失败：未找到全局 hljs");
  }

  return loadHighlightJsAdapter({ hljs, register: options.register });
}
