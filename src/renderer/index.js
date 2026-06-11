/**
 * @file 渲染器入口
 * @module renderer/index
 *
 * 将 Transformer 输出的 HTML 写入预览 DOM。
 */

import { setupCherryCodeHighlight } from "./codeHighlight.js";
import {
  hydrateCherryTheme,
  refreshCherryTheme,
  watchCherryTheme,
} from "./cherryTheme.js";

export {
  CHERRY_THEME_CHANGE_EVENT,
  dispatchCherryThemeChange,
  hydrateCherryMath,
  hydrateCherryTheme,
  isCherryDarkMode,
  mathImageColor,
  refreshCherryTheme,
  watchCherryTheme,
} from "./cherryTheme.js";
export { hydrateCherryCodeCopy } from "./codeCopy.js";
export { hydrateCherryCodeCollapse } from "./codeCollapse.js";
export {
  createCodeHighlightPlugin,
  hydrateCherryCodeHighlight,
  registerCherryCodeHighlightLoader,
  resetCherryCodeHighlightTheme,
  setupCherryCodeHighlight,
} from "./codeHighlight.js";
export { loadHighlightJsAdapter } from "./adapters/highlightjs.js";
export {
  DEFAULT_HIGHLIGHT_JS_CDN,
  DEFAULT_HIGHLIGHT_JS_CSS,
  loadHighlightJsFromCdn,
} from "./adapters/highlightjsCdn.js";
export { loadShikiAdapter } from "./adapters/shiki.js";
export { loadScript, loadStylesheet } from "./utils/loadScript.js";

/** @type {'innerHTML'} 当前唯一支持的 DOM 更新策略 */
const STRATEGY_INNER_HTML = "innerHTML";

/**
 * 创建预览渲染器。
 *
 * @param {Object} [options={}]
 * @param {HTMLElement} options.mount - 预览区 DOM 节点
 * @param {typeof STRATEGY_INNER_HTML} [options.strategy='innerHTML'] - 渲染策略，目前仅支持 innerHTML
 * @param {boolean} [options.watchTheme=true] - 是否监听 `data-theme` / `cherry-theme-change` 并自动刷新
 * @param {import('./codeHighlight.js').CodeHighlightSetup} [options.codeHighlight] - 代码高亮：cdn / load / highlight 回调
 * @returns {RendererApi}
 */
export function createRenderer({
  mount,
  strategy = STRATEGY_INNER_HTML,
  watchTheme = true,
  codeHighlight,
} = {}) {
  if (!mount) {
    throw new Error("渲染器需要 mount 元素");
  }

  setupCherryCodeHighlight(codeHighlight);

  /** @type {RendererPlugin[]} */
  const plugins = [];
  /** @type {(() => void) | null} */
  let unwatchTheme = watchTheme ? watchCherryTheme(mount, refreshCherryTheme) : null;

  /**
   * 依次调用插件钩子。
   *
   * @param {'beforeUpdate'|'afterUpdate'|'beforeDestroy'|'afterDestroy'} name
   * @param {Object} payload
   */
  function runHook(name, payload) {
    for (const plugin of plugins) {
      if (typeof plugin[name] === "function") {
        plugin[name](payload);
      }
    }
  }

  /** @type {RendererApi} */
  return {
    /** 更新预览内容，input 通常为 transformer.render() 的返回值 */
    update(input) {
      runHook("beforeUpdate", { mount, input });

      if (strategy === STRATEGY_INNER_HTML) {
        mount.innerHTML = input.html || "";
      } else {
        throw new Error(`不支持的渲染策略: ${strategy}`);
      }

      runHook("afterUpdate", { mount, input });
      hydrateCherryTheme(mount);
    },

    /**
     * 注册渲染插件。
     *
     * @param {RendererPlugin} plugin
     */
    use(plugin) {
      plugins.push(plugin);
    },

    /** 清空预览 DOM 并触发销毁钩子 */
    destroy() {
      runHook("beforeDestroy", { mount });
      unwatchTheme?.();
      unwatchTheme = null;
      mount.innerHTML = "";
      runHook("afterDestroy", { mount });
    },
  };
}

/**
 * @typedef {Object} RendererPlugin
 * @property {(payload: { mount: HTMLElement, input?: { html: string } }) => void} [beforeUpdate]
 * @property {(payload: { mount: HTMLElement, input?: { html: string } }) => void} [afterUpdate]
 * @property {(payload: { mount: HTMLElement }) => void} [beforeDestroy]
 * @property {(payload: { mount: HTMLElement }) => void} [afterDestroy]
 */

/**
 * @typedef {Object} RendererApi
 * @property {(input: { html: string }) => void} update
 * @property {(plugin: RendererPlugin) => void} use
 * @property {() => void} destroy
 */
