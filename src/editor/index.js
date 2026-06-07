/**
 * @file 编辑器入口
 * @module editor/index
 *
 * 编排 CodeMirror 6（编辑区）+ Transformer（解析渲染）+ Renderer（预览 DOM）。
 */

import { history, historyKeymap, defaultKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { createTransformer } from "../transformer/index.js";
import { createRenderer } from "../renderer/index.js";

/**
 * 将 extensions 规范为数组。
 *
 * @param {import('@codemirror/state').Extension|import('@codemirror/state').Extension[]} [extensions=[]]
 * @returns {import('@codemirror/state').Extension[]}
 */
function normalizeExtensions(extensions = []) {
  return Array.isArray(extensions) ? extensions : [extensions];
}

/**
 * 创建 Cherry Markdown Next 编辑器实例。
 *
 * @param {Object} [options={}]
 * @param {HTMLElement} options.mount - 编辑区容器（必填）
 * @param {HTMLElement} options.preview - 预览区容器（必填）
 * @param {string} [options.initial=""] - 初始 Markdown 文本
 * @param {import('@codemirror/state').Extension|import('@codemirror/state').Extension[]} [options.extensions=[]]
 * @param {typeof createTransformer} [options.transformer=createTransformer]
 * @param {typeof createRenderer} [options.renderer=createRenderer]
 * @param {ConstructorParameters<typeof createTransformer>[0]} [options.transformerOptions={}]
 * @param {ConstructorParameters<typeof createRenderer>[0]} [options.rendererOptions={}]
 * @returns {EditorApi}
 */
export function createEditor({
  mount,
  preview,
  initial = "",
  extensions = [],
  transformer: transformerFactory = createTransformer,
  renderer: rendererFactory = createRenderer,
  transformerOptions = {},
  rendererOptions = {},
} = {}) {
  if (!mount) {
    throw new Error("编辑器需要 mount 元素");
  }
  if (!preview) {
    throw new Error("编辑器需要 preview 元素");
  }

  const transformer = transformerFactory(transformerOptions);
  const renderer = rendererFactory({ mount: preview, ...rendererOptions });

  const subscribers = new Set();
  const pluginList = [];

  /** 读取当前文档并刷新预览 */
  const renderPreview = () => {
    const markdownText = view.state.doc.toString();
    const result = transformer.render(markdownText);
    renderer.update(result);
    return result;
  };

  const updateListener = EditorView.updateListener.of((update) => {
    if (!update.docChanged) {
      return;
    }
    renderPreview();
    const markdownText = update.state.doc.toString();
    subscribers.forEach((fn) => fn(markdownText));
  });

  const state = EditorState.create({
    doc: initial,
    extensions: [
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      markdown(),
      updateListener,
      ...normalizeExtensions(extensions),
    ],
  });

  const view = new EditorView({ state, parent: mount });

  /** @type {EditorApi} */
  const api = {
    getMarkdown() {
      return view.state.doc.toString();
    },

    setMarkdown(markdownText) {
      const current = view.state.doc.toString();
      view.dispatch({
        changes: { from: 0, to: current.length, insert: String(markdownText) },
      });
      renderPreview();
    },

    renderNow() {
      return renderPreview();
    },

    getTransformer() {
      return transformer;
    },

    getRenderer() {
      return renderer;
    },

    focus() {
      view.focus();
    },

    onChange(callback) {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },

    execute(command, payload) {
      if (command === "insertText" && typeof payload === "string") {
        const { from, to } = view.state.selection.main;
        view.dispatch({ changes: { from, to, insert: payload } });
      }
    },

    useSyntaxPlugin(plugin) {
      transformer.use(plugin);
      renderPreview();
    },

    useRendererPlugin(plugin) {
      renderer.use(plugin);
      renderPreview();
    },

    use(plugin) {
      pluginList.push(plugin);
      if (typeof plugin.onMount === "function") {
        plugin.onMount({ view, api, transformer, renderer });
      }
    },

    destroy() {
      pluginList.forEach((plugin) => {
        if (typeof plugin.onDestroy === "function") {
          plugin.onDestroy({ view, api, transformer, renderer });
        }
      });
      subscribers.clear();
      view.destroy();
      renderer.destroy();
    },
  };

  renderPreview();

  return api;
}

/**
 * @typedef {Object} EditorApi
 * @property {() => string} getMarkdown
 * @property {(markdownText: string) => void} setMarkdown
 * @property {() => ReturnType<import('../transformer/TransformerEngine.js').TransformerEngine['render']>} renderNow
 * @property {() => import('../transformer/TransformerEngine.js').TransformerEngine} getTransformer
 * @property {() => ReturnType<typeof createRenderer>} getRenderer
 * @property {() => void} focus
 * @property {(callback: (markdown: string) => void) => () => boolean} onChange
 * @property {(command: string, payload: unknown) => void} execute
 * @property {(plugin: Object) => void} useSyntaxPlugin
 * @property {(plugin: Object) => void} useRendererPlugin
 * @property {(plugin: Object) => void} use
 * @property {() => void} destroy
 */
