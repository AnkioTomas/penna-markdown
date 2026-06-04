/**
 * 渲染器：将 Transformer 输出的 HTML 写入预览 DOM。
 */

const STRATEGY_INNER_HTML = "innerHTML";

/**
 * 创建预览渲染器。
 * mount：预览区 DOM 节点；strategy 目前仅支持 innerHTML。
 */
export function createRenderer({ mount, strategy = STRATEGY_INNER_HTML } = {}) {
  if (!mount) {
    throw new Error("渲染器需要 mount 元素");
  }

  const plugins = [];

  function runHook(name, payload) {
    for (const plugin of plugins) {
      if (typeof plugin[name] === "function") {
        plugin[name](payload);
      }
    }
  }

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

    use(plugin) {
      plugins.push(plugin);
    },

    destroy() {
      runHook("beforeDestroy", { mount });
      mount.innerHTML = "";
      runHook("afterDestroy", { mount });
    },
  };
}
