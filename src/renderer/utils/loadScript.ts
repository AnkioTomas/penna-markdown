/**
 * @file 动态加载外部脚本 / 样式（CDN）
 * @module renderer/utils/loadScript
 */

const scriptCache = new Map<string, Promise<void>>();
const styleCache = new Map<string, Promise<void>>();

export function loadScript(src: string): Promise<void> {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("loadScript 仅可在浏览器环境使用"));
  }

  const cached = scriptCache.get(src);
  if (cached) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${CSS.escape(src)}"]`);
    if (existing instanceof HTMLScriptElement) {
      if (existing.dataset.cherryLoaded === "1") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`脚本加载失败: ${src}`)), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.cherryLoaded = "1";
      resolve();
    };
    script.onerror = () => reject(new Error(`脚本加载失败: ${src}`));
    document.head.appendChild(script);
  });

  scriptCache.set(src, promise);
  return promise;
}

export function loadStylesheet(href: string): Promise<void> {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("loadStylesheet 仅可在浏览器环境使用"));
  }

  const cached = styleCache.get(href);
  if (cached) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`link[rel="stylesheet"][href="${CSS.escape(href)}"]`);
    if (existing) {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`样式加载失败: ${href}`));
    document.head.appendChild(link);
  });

  styleCache.set(href, promise);
  return promise;
}
