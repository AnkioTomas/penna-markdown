import MarkdownIt from 'markdown-it';
import CodeMirror from 'codemirror';
import 'codemirror/mode/markdown/markdown.js';
import 'codemirror/lib/codemirror.css';
import './penna.scss';

// 创建 markdown-it 实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

class Penna {
  constructor(selector) {
    this.selector = selector;
    this.element = document.querySelector(selector);
    this.content = '';
    this.options = {};
    this.dom = {}; // 存放 UI 节点引用
    this.cm = null; // CodeMirror 实例
  }

  /**
   * 初始化 Penna 编辑器
   * @param {Object} options - 可选参数 { content: string }
   */
  init(options = {}) {
    this.options = { ...this.options, ...options };

    if (!this.element) {
      console.error(`Element with selector "${this.selector}" not found`);
      return;
    }

    this._buildLayout();
    this._initCodeMirror();
    this._bindEvents();

    // 初始化内容
    if (this.options.content) {
      this.setContent(this.options.content);
    } else {
      // 空内容也要刷新界面
      this._updatePreview();
      this._updateStats();
    }
  }

  /**
   * 构建 DOM 结构
   */
  _buildLayout() {
    this.element.classList.add('penna-container');
    this.element.innerHTML = `
      <div class="penna-header">Penna Editor</div>
      <div class="penna-body">
        <div class="penna-editor"></div>
        <div class="penna-preview"></div>
        <div class="penna-toc"></div>
      </div>
      <div class="penna-footer">
        <span class="penna-word-count">字数: 0</span>
        <span class="penna-paragraph-count">段落: 0</span>
      </div>
    `;

    this.dom.editor = this.element.querySelector('.penna-editor');
    this.dom.preview = this.element.querySelector('.penna-preview');
    this.dom.wordCount = this.element.querySelector('.penna-word-count');
    this.dom.paragraphCount = this.element.querySelector('.penna-paragraph-count');
    this.dom.toc = this.element.querySelector('.penna-toc');
  }

  /**
   * 初始化 CodeMirror 编辑器
   */
  _initCodeMirror() {
    this.cm = CodeMirror(this.dom.editor, {
      mode: 'markdown',
      lineNumbers: true,
      lineWrapping: true,
      value: this.content
    });
  }

  /**
   * 绑定 CodeMirror 事件
   */
  _bindEvents() {
    this.cm.on('change', () => {
      this.content = this.cm.getValue();
      this._updatePreview();
      this._updateStats();
      this._updateTOC();
    });
  }

  /** 渲染 Markdown 预览 */
  _updatePreview() {
    this.dom.preview.innerHTML = md.render(this.content);
  }

  /** 更新字数、段落统计 */
  _updateStats() {
    const words = this.content.trim().split(/\s+/).filter(Boolean);
    const paragraphs = this.content.trim().split(/\n{2,}/).filter(Boolean);
    this.dom.wordCount.textContent = `字数: ${words.length}`;
    this.dom.paragraphCount.textContent = `段落: ${paragraphs.length}`;
  }

  /** 生成右侧目录 */
  _updateTOC() {
    const html = md.render(this.content);
    const container = document.createElement('div');
    container.innerHTML = html;
    const headers = container.querySelectorAll('h1, h2, h3');

    this.dom.toc.innerHTML = '<strong>目录</strong><ul>' +
      Array.from(headers).map(h => {
        const text = h.textContent;
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        h.id = id; // 给标题添加锚点，预览区内部
        return `<li><a href="#${id}">${text}</a></li>`;
      }).join('') + '</ul>';
  }

  /**
   * 公开 API：设置内容
   * @param {string} markdownContent
   */
  setContent(markdownContent) {
    this.content = markdownContent;
    this.cm.setValue(markdownContent);
    this._updatePreview();
    this._updateStats();
    this._updateTOC();
  }

  /** 获取当前 Markdown 文本 */
  getContent() {
    return this.content;
  }

  /** 更新内容（语法糖） */
  updateContent(newContent) {
    this.setContent(newContent);
  }

  /** 注册 markdown-it 插件 */
  use(plugin, options = {}) {
    md.use(plugin, options);
    this._updatePreview();
    return this;
  }

  /** 快速挂载辅助函数 */
  static mount(selector, markdown = '') {
    const penna = new Penna(selector);
    penna.init({ content: markdown });
    return penna;
  }
}

export default Penna;
