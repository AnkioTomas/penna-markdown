/**
 * @file Shiki 高亮适配器（动态 import）
 * @module renderer/adapters/shiki
 *
 * 需自行安装 `shiki`：`pnpm add shiki`
 */

import { wrapCodeLineHtml } from "@/transformer/extends/utils/renderCodeLines.js";

/**
 * @typedef {import('../codeHighlight.js').CodeHighlightAdapter} CodeHighlightAdapter
 */

/**
 * @param {Object} [options]
 * @param {string[]} [options.themes=['github-light','github-dark']]
 * @param {string[]} [options.langs] - 预加载语言；省略则按块级 lang 动态加载
 * @returns {Promise<CodeHighlightAdapter>}
 */
export async function loadShikiAdapter(options = {}) {
  const themes = options.themes ?? ["github-light", "github-dark"];
  const { createHighlighter } = await import("shiki");
  const highlighter = await createHighlighter({
    themes,
    langs: options.langs ?? ["javascript", "json", "bash", "typescript", "css", "html", "markdown"],
  });

  const [lightTheme, darkTheme] = themes;

  return {
    highlight(code, lang, { dark, highlightLines = [] } = {}) {
      const language = lang || "text";
      const loaded = highlighter.getLoadedLanguages().includes(language);
      const targetLang = loaded ? language : "text";
      const theme = dark ? darkTheme : lightTheme;

      if (highlightLines.length > 0) {
        const highlightSet = new Set(highlightLines);
        return code
          .split("\n")
          .map((line, index) => {
            const inner = highlighter.codeToHtml(line, { lang: targetLang, theme });
            const codeInner = inner.replace(/^<pre[^>]*><code[^>]*>/i, "").replace(/<\/code><\/pre>$/i, "");
            return wrapCodeLineHtml(codeInner, index + 1, highlightSet);
          })
          .join("\n");
      }

      return highlighter.codeToHtml(code, {
        lang: targetLang,
        theme,
      });
    },
  };
}
