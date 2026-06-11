/**
 * @file highlight.js 高亮适配器（动态 import）
 * @module renderer/adapters/highlightjs
 */

import { highlightCodeByLines } from "@/renderer/utils/highlightByLines.js";

/**
 * @typedef {import('../codeHighlight.js').CodeHighlightAdapter} CodeHighlightAdapter
 */

/**
 * @param {Object} [options]
 * @param {typeof import('highlight.js').default} [options.hljs] - 已加载的 hljs 实例
 * @param {(hljs: typeof import('highlight.js').default) => void | Promise<void>} [options.register] - 注册额外语言
 * @returns {Promise<CodeHighlightAdapter>}
 */
export async function loadHighlightJsAdapter(options = {}) {
  const hljs = options.hljs ?? (await import("highlight.js")).default;
  if (options.register) await options.register(hljs);

  return {
    highlight(code, lang, ctx = {}) {
      const highlightLines = ctx.highlightLines ?? [];
      // Cherry 增强代码块始终按行高亮，保留换行与行高亮/折叠标记
      if (ctx.panel) {
        return highlightCodeByLines(hljs, code, lang, highlightLines, ctx.panel);
      }
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
      }
      return hljs.highlightAuto(code, { ignoreIllegals: true }).value;
    },
  };
}
