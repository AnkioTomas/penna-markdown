/**
 * @file Cherry 远程媒体主题适配
 * @module renderer/cherryTheme
 *
 * 根据 `.cherry` 祖先上的 `[data-theme=dark]` 刷新 Math / Mermaid / ECharts 图片与代码高亮：
 * - 暗色：Math `color=white`，Mermaid `theme=dark`，ECharts `theme=dark`
 * - 其余：不传主题参数（各 API 默认亮色）
 */

import {
  base64UrlDecode,
  buildEchartsImageSrc,
  buildMathImageSrc,
  buildMermaidImageSrc,
} from "@/transformer/extends/utils/cherryApi.js";
import { hydrateCherryCodeCollapse } from "./codeCollapse.js";
import { hydrateCherryCodeCopy } from "./codeCopy.js";
import {
  getCherryCodeHighlightLoader,
  hydrateCherryCodeHighlight,
  resetCherryCodeHighlightTheme,
} from "./codeHighlight.js";

/** 手动触发主题刷新时派发的冒泡事件名 */
export const CHERRY_THEME_CHANGE_EVENT = "cherry-theme-change";

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
 * 查找承载 `data-theme` 的节点（通常为 `html` 或 `.cherry` 祖先）。
 *
 * @param {HTMLElement} cherry
 * @returns {HTMLElement}
 */
/**
 * @param {HTMLElement} cherry
 * @returns {HTMLElement}
 */
function findThemeElement(cherry) {
  const themed = cherry.closest("[data-theme]");
  if (themed && "setAttribute" in themed) return themed;
  const doc = cherry.ownerDocument;
  if (doc?.documentElement && "setAttribute" in doc.documentElement) {
    return doc.documentElement;
  }
  return cherry;
}

/**
 * `.cherry` 是否处于 `[data-theme=dark]` 上下文中。
 *
 * @param {ParentNode | null | undefined} container
 * @returns {boolean}
 */
export function isCherryDarkMode(container) {
  const cherry = findCherryRoot(container);
  if (!cherry) return false;
  return cherry.closest('[data-theme="dark"]') !== null;
}

/** @param {ParentNode | null | undefined} container @returns {"white" | undefined} */
export function mathImageColor(container) {
  return isCherryDarkMode(container) ? "white" : undefined;
}

/**
 * @param {HTMLImageElement} img
 * @param {string} src
 */
function setImgSrc(img, src) {
  if (src && img.src !== src) img.src = src;
}

/**
 * 刷新容器内 Math / Mermaid / ECharts 远程图片与代码块交互。
 *
 * @param {ParentNode | null | undefined} container
 */
export function hydrateCherryTheme(container) {
  const cherry = findCherryRoot(container);
  if (!cherry) return;

  const dark = isCherryDarkMode(container);
  const mathColor = dark ? "white" : undefined;
  const mediaTheme = dark ? "dark" : undefined;

  cherry.querySelectorAll(".cherry-math-latex[data-latex]").forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;
    const latex = img.getAttribute("data-latex") ?? "";
    const inline = img.getAttribute("data-inline") === "true";
    setImgSrc(img, buildMathImageSrc(latex, { inline, color: mathColor }));
  });

  cherry.querySelectorAll(".cherry-mermaid__img[data-mermaid]").forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;
    const code = base64UrlDecode(img.getAttribute("data-mermaid") ?? "");
    setImgSrc(img, buildMermaidImageSrc(code, { theme: mediaTheme }));
  });

  cherry.querySelectorAll(".cherry-echarts__img[data-echarts]").forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;
    const source = base64UrlDecode(img.getAttribute("data-echarts") ?? "");
    setImgSrc(img, buildEchartsImageSrc(source, { theme: mediaTheme }));
  });

  hydrateCherryCodeCopy(container);
  hydrateCherryCodeCollapse(container);

  const highlightLoader = getCherryCodeHighlightLoader();
  if (highlightLoader) {
    void hydrateCherryCodeHighlight(container, {
      getAdapter: highlightLoader,
      isDark: () => isCherryDarkMode(container),
    });
  }
}

/**
 * 主题切换时强制刷新：先清除代码高亮缓存，再 hydrate。
 *
 * @param {ParentNode | null | undefined} container
 */
export function refreshCherryTheme(container) {
  resetCherryCodeHighlightTheme(container);
  hydrateCherryTheme(container);
}

/**
 * 派发 `cherry-theme-change` 事件，供外部主题开关调用。
 *
 * @param {EventTarget} [target]
 */
export function dispatchCherryThemeChange(target) {
  const el =
    target ??
    (typeof document !== "undefined" ? document.documentElement : null);
  if (!el) return;
  el.dispatchEvent(
    new CustomEvent(CHERRY_THEME_CHANGE_EVENT, { bubbles: true }),
  );
}

/**
 * 监听 `data-theme` 变更与 `cherry-theme-change` 事件，自动刷新 Cherry 预览主题。
 *
 * @param {ParentNode | null | undefined} container
 * @param {(container: ParentNode) => void} [onThemeChange]
 * @returns {() => void} 取消监听
 */
export function watchCherryTheme(container, onThemeChange = refreshCherryTheme) {
  const cherry = findCherryRoot(container) ?? container;
  if (!cherry || !("closest" in cherry)) return () => {};

  const themeEl = findThemeElement(cherry);
  const observed = new Set();

  const run = () => onThemeChange(container);

  const doc = cherry.ownerDocument;
  const docEl = doc?.documentElement;
  const docBody = doc?.body;

  const onCustomEvent = () => run();
  themeEl.addEventListener(CHERRY_THEME_CHANGE_EVENT, onCustomEvent);
  docEl?.addEventListener(CHERRY_THEME_CHANGE_EVENT, onCustomEvent);

  const observer = new MutationObserver((records) => {
    if (records.some((record) => record.attributeName === "data-theme")) {
      run();
    }
  });

  for (const el of [themeEl, docEl, docBody]) {
    if (!el || !("setAttribute" in el) || observed.has(el)) continue;
    observed.add(el);
    observer.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
  }

  return () => {
    themeEl.removeEventListener(CHERRY_THEME_CHANGE_EVENT, onCustomEvent);
    docEl?.removeEventListener(CHERRY_THEME_CHANGE_EVENT, onCustomEvent);
    observer.disconnect();
  };
}

/** @deprecated 使用 hydrateCherryTheme */
export const hydrateCherryMath = hydrateCherryTheme;
