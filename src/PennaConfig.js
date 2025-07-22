/**
 * Penna 编辑器的默认配置对象。
 * @typedef {Object} PennaConfig
 * @property {string} container 编辑器容器的选择器，指定编辑器挂载的 DOM 元素。
 * @property {Object} editor 编辑器相关配置。
 * @property {string} editor.mode 编辑器模式，可选值：
 *   - "edit&preview"：编辑和预览同时显示
 *   - "preview"：仅预览模式
 *   - "edit"：仅编辑模式
 */

/** @type {PennaConfig} */
const config = {
    container: "#penna-editor",
    editor: {
        mode: "edit&preview",
    }
};

export default config;
