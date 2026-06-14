/**
 * @file HTML 转义工具
 * @module transformer/utils/escape
 *
 * 渲染阶段将文本与属性值转义，防止 XSS。
 */

import DOMPurify, {Config} from "dompurify";

/**
 * 转义 HTML 特殊字符（&、<、>、"）。
 *
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * CommonMark 行内文本转义（与 GFM 期望一致）。
 *
 * @param {string} text
 * @returns {string}
 */
export function escapeText(text: string): string {
  return escapeHtml(text);
}

/**
 * 定界符前奇数个 `\` 表示该字符被转义。
 */
export function isEscaped(src: string, index: number): boolean {
  let n = 0;
  for (let i = index - 1; i >= 0 && src[i] === "\\"; i -= 1) n += 1;
  return n % 2 === 1;
}

/**
 * 生成可选的 HTML 属性片段（值非空时转义并输出）。
 */
export function htmlAttr(name: string, value: string): string {
  return value ? ` ${name}="${escapeHtml(value)}"` : "";
}

const DEFAULT_CONFIG: Config = {
  // =========================================================================
  // 允许的 HTML 标签 (ALLOWED_TAGS)
  // =========================================================================
  ALLOWED_TAGS: [
    // 1. 标题与区块
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'blockquote',

    // 2. 行内格式化 (Typography)
    'b', 'strong', 'i', 'em', 's', 'del', 'strike', 'kbd', 'sub', 'sup', 'mark', 'ruby', 'rt', 'rp',

    // 3. 代码 (必须包含，否则 ```代码块 会被吞掉标签)
    'pre', 'code',

    // 4. 列表
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',

    // 5. 表格 (极为重要，GFM 表格最终就是渲染成这些)
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',

    // 6. 链接与图片
    'a', 'img', 'picture', 'source',

    // 7. 容器与语义化 (允许用户自己写折叠面板或图文描述)
    'div', 'span', 'details', 'summary', 'figure', 'figcaption',
    'section', 'article', 'aside', 'header', 'footer', 'main',

    // 8. 音视频 (可选：如果你希望支持 HTML5 媒体播放)
    'video', 'audio', 'track'
  ],

  // =========================================================================
  // 允许的 HTML 属性 (ALLOWED_ATTR)
  // =========================================================================
  ALLOWED_ATTR: [
    // 1. 全局通用
    'id',      // 允许锚点跳转
    'class',   // 极其重要！代码高亮（如 class="language-js"）依赖它
    'title',   // 鼠标悬停提示
    'style',   // 允许行内样式 (DOMPurify 会自动剥离 CSS 里的恶意代码)

    // 2. 链接与媒体
    'href',    // 链接地址 (DOMPurify 会自动拦截 javascript: 协议)
    'src',     // 媒体地址
    'alt',     // 图片替代文本
    'target',  // 允许新窗口打开链接
    'rel',     // 配合 target="_blank" 的安全属性

    // 3. 媒体控制 (如果开启了 video/audio)
    'controls', 'width', 'height', 'poster', 'loop', 'muted', 'preload',

    // 4. 表格排版
    'align', 'valign', 'colspan', 'rowspan',

    // 5. details 交互
    'open'
  ],

  // =========================================================================
  // 严格的安全约束选项
  // =========================================================================

  // 必须开启：防范利用 DOM Clobbering 攻击
  SANITIZE_DOM: true,

  // 必须开启：防范绕过模板等高级攻击
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,

  // 拒绝未知的协议（默认就是打开的，这里显式声明更安全）
  ALLOW_UNKNOWN_PROTOCOLS: false
};

/**
 * 净化 HTML 字符串，移除 XSS 向量。
 */
export function sanitizeHtml(html: string): string {
  // 在服务端环境 (Node.js) 使用 DOMPurify 时，可能需要传入 window 实例
  // 浏览器环境直接使用即可
  return DOMPurify.sanitize(html, DEFAULT_CONFIG);
}