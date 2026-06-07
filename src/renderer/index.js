/**
 * @file 渲染器入口
 * @module renderer/index
 *
 * 将 Transformer 输出的 HTML 写入预览 DOM。
 */

/** @type {'innerHTML'} 当前唯一支持的 DOM 更新策略 */
const STRATEGY_INNER_HTML = "innerHTML";

/**
 * 创建预览渲染器。
 *
 * @param {Object} [options={}]
 * @param {HTMLElement} options.mount - 预览区 DOM 节点
 * @param {typeof STRATEGY_INNER_HTML} [options.strategy='innerHTML'] - 渲染策略，目前仅支持 innerHTML
 * @returns {RendererApi}
 */
export function createRenderer({ mount, strategy = STRATEGY_INNER_HTML } = {}) {
  if (!mount) {
    throw new Error("渲染器需要 mount 元素");
  }

  /** @type {RendererPlugin[]} */
  const plugins = [];

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
