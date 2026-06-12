/**
 * @file 代码块语法高亮（客户端动态插件）
 * @module renderer/codeHighlight
 */

import { readCodeLinesText } from "@/transformer/extends/utils/renderCodeLines.js";
import { parseHighlightLinesAttr } from "@/transformer/extends/utils/parseLineHighlight.js";
import { isCherryDarkMode } from "./cherryTheme.js";

/** @type {(() => Promise<import('./codeHighlight.js').CodeHighlightAdapter>) | null} */
let registeredLoader = null;

/**
 * @typedef {Object} CodeHighlightAdapter
 * @property {(code: string, lang: string, ctx: { dark: boolean, panel: HTMLElement, highlightLines?: number[] }) => Promise<string> | string} highlight
 */

/**
 * 注册全局高亮加载器，供 `hydrateCherryTheme` 在主题切换时重新高亮。
 *
 * @param {() => Promise<CodeHighlightAdapter>} load
 */
export function registerCherryCodeHighlightLoader(load) {
  registeredLoader = load;
}

/**
 * @returns {(() => Promise<CodeHighlightAdapter>) | null}
 */
export function getCherryCodeHighlightLoader() {
  return registeredLoader;
}

/**
 * @param {ParentNode | null | undefined} container
 * @returns {HTMLElement | null}
 */
function findCherryRoot(container) {
  if (!container || !("querySelector" in container)) return null;
  if ("classList" in container && container.classList.contains("cherry")) {
    return container;
  }
  return container.querySelector(".cherry");
}

/**
 * @param {string} text
 * @returns {string}
 */
function encodeSource(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

/**
 * @param {string} encoded
 * @returns {string}
 */
function decodeSource(encoded) {
  return decodeURIComponent(escape(atob(encoded)));
}

/**
 * @param {HTMLElement} codeEl
 * @returns {string}
 */
function readCodeSource(codeEl) {
  const stored = codeEl.dataset.cherrySource;
  if (stored) return decodeSource(stored);

  const text = readCodeLinesText(codeEl);
  codeEl.dataset.cherrySource = encodeSource(text);
  return text;
}

/**
 * @param {HTMLElement} codeEl
 * @param {string} html
 */
function applyHighlightHtml(codeEl, html) {
  const pre = codeEl.closest("pre");
  if (!html) return;

  if (html.includes("<pre")) {
    const tpl = document.createElement("template");
    tpl.innerHTML = html.trim();
    const newPre = tpl.content.querySelector("pre");
    if (!newPre || !pre) return;

    newPre.classList.add("cherry-code-block__pre");
    const newCode = newPre.querySelector("code");
    if (newCode) {
      newCode.dataset.cherryCode = "";
      newCode.dataset.cherryHighlighted = "1";
      if (codeEl.dataset.cherrySource) {
        newCode.dataset.cherrySource = codeEl.dataset.cherrySource;
      }
      const panel = pre.closest(".cherry-code-block__panel");
      if (panel && "dataset" in panel && panel.dataset.cherryHighlightLines) {
        newCode.dataset.cherryHighlightLines = panel.dataset.cherryHighlightLines;
      }
      for (const cls of codeEl.classList) {
        newCode.classList.add(cls);
      }
    }
    pre.replaceWith(newPre);
    return;
  }

  codeEl.innerHTML = html;
  codeEl.classList.add("cherry-code-block__highlighted", "hljs");
  codeEl.dataset.cherryHighlighted = "1";
}

/**
 * 清除代码块高亮缓存，以便主题切换后重新着色（Shiki 等内联样式场景）。
 *
 * @param {ParentNode | null | undefined} container
 */
export function resetCherryCodeHighlightTheme(container) {
  const root = findCherryRoot(container) ?? container;
  if (!root || !("querySelectorAll" in root)) return;

  root
    .querySelectorAll("code[data-cherry-code], code.cherry-code-block__highlighted")
    .forEach((codeEl) => {
      if (!("dataset" in codeEl)) return;
      delete codeEl.dataset.cherryHighlighted;
      delete codeEl.dataset.cherryHighlightTheme;
    });
}

/**
 * 对容器内增强代码块执行语法高亮。
 *
 * @param {ParentNode | null | undefined} container
 * @param {{
 *   getAdapter?: () => Promise<CodeHighlightAdapter>,
 *   isDark?: (container: ParentNode) => boolean
 * }} [options]
 * @returns {Promise<void>}
 */
export async function hydrateCherryCodeHighlight(container, options = {}) {
  const load = options.getAdapter ?? registeredLoader;
  if (!load) return;

  const root = findCherryRoot(container) ?? container;
  if (!root || !("querySelectorAll" in root)) return;

  const adapter = await load();
  const dark = options.isDark?.(container) ?? isCherryDarkMode(container);
  const themeKey = dark ? "dark" : "light";

  const codes = root.querySelectorAll(".cherry-code-block__panel code[data-cherry-code]");
  await Promise.all(
    [...codes].map(async (codeEl) => {
      if (!("classList" in codeEl)) return;

      const panel = codeEl.closest(".cherry-code-block__panel");
      if (!panel) return;

      if (
        codeEl.dataset.cherryHighlighted === "1" &&
        codeEl.dataset.cherryHighlightTheme === themeKey
      ) {
        return;
      }

      const langMatch = [...codeEl.classList].find((c) => c.startsWith("language-"));
      const lang = langMatch ? langMatch.slice("language-".length) : "";
      const source = readCodeSource(codeEl);
      const highlightLines = parseHighlightLinesAttr(
        panel.dataset.cherryHighlightLines ?? codeEl.dataset.cherryHighlightLines,
      );

      try {
        const html = await adapter.highlight(source, lang, { dark, panel, highlightLines });
        applyHighlightHtml(codeEl, html);
        const active = panel.querySelector("code[data-cherry-code], code.cherry-code-block__highlighted");
        if (active && "dataset" in active) {
          active.dataset.cherryHighlightTheme = themeKey;
        }
      } catch {
        codeEl.dataset.cherryHighlighted = "0";
      }
    }),
  );
}

/**
 * @typedef {Object} CodeHighlightSetup
 * @property {string} [cdn] - highlight.js 脚本 CDN URL
 * @property {string | boolean} [css] - 主题 CSS；`true` 用默认 github 主题
 * @property {() => Promise<CodeHighlightAdapter>} [load] - 自定义加载器（动态 import / CDN 等）
 * @property {CodeHighlightAdapter['highlight']} [highlight] - 直接提供高亮回调
 * @property {(hljs: unknown) => void | Promise<void>} [register] - 注册额外语言
 */

/**
 * 根据配置注册代码高亮加载器。
 *
 * 优先级：`highlight` 回调 > `load()` > `cdn`。
 *
 * @param {CodeHighlightSetup | null | undefined} setup
 */
export function setupCherryCodeHighlight(setup) {
  if (!setup) return;

  if (typeof setup.highlight === "function") {
    registerCherryCodeHighlightLoader(async () => ({
      highlight: setup.highlight,
    }));
    return;
  }

  if (typeof setup.load === "function") {
    registerCherryCodeHighlightLoader(setup.load);
    return;
  }

  if (setup.cdn) {
    registerCherryCodeHighlightLoader(async () => {
      const { loadHighlightJsFromCdn } = await import("./adapters/highlightjsCdn.js");
      return loadHighlightJsFromCdn({
        cdn: setup.cdn,
        css: setup.css,
        register: setup.register,
      });
    });
  }
}

/**
 * 创建渲染器插件：动态加载高亮库并在每次预览更新后高亮代码块。
 *
 * @param {CodeHighlightSetup & {
 *   isDark?: (container: ParentNode) => boolean
 * }} options
 * @returns {import('./index.js').RendererPlugin}
 */
export function createCodeHighlightPlugin(options) {
  if (!options?.load && !options?.highlight && !options?.cdn) {
    throw new Error("createCodeHighlightPlugin 需要 load、highlight 或 cdn 之一");
  }

  setupCherryCodeHighlight(options);
  const load = options.load ?? getCherryCodeHighlightLoader();
  if (!load) {
    throw new Error("代码高亮加载器未注册");
  }

  return {
    afterUpdate({ mount }) {
      void hydrateCherryCodeHighlight(mount, {
        getAdapter: load,
        isDark: options.isDark,
      });
    },
  };
}
