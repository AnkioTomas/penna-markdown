/**
 * @file Cherry 远程媒体主题适配
 * @module renderer/cherryTheme
 *
 * 根据 `.cherry` 祖先上的 `[data-theme=dark]` 刷新 Math / Mermaid / ECharts 图片：
 * - 暗色：Math `color=white`，Mermaid `theme=dark`，ECharts `theme=dark`
 * - 其余：不传主题参数（各 API 默认亮色）
 */

import {
  base64UrlDecode,
  buildEchartsImageSrc,
  buildMathImageSrc,
  buildMermaidImageSrc,
} from "@/transformer/extends/utils/cherryApi.js";

/**
 * @param {ParentNode | null | undefined} container
 * @returns {HTMLElement | null}
 */
function findCherryRoot(container) {
  if (!container || !("querySelector" in container)) return null;
  if (container instanceof HTMLElement && container.classList.contains("cherry")) {
    return container;
  }
  return container.querySelector(".cherry");
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
 * 刷新容器内 Math / Mermaid / ECharts 远程图片。
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
}

/** @deprecated 使用 hydrateCherryTheme */
export const hydrateCherryMath = hydrateCherryTheme;
