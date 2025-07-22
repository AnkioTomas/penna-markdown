import MarkdownIt from 'markdown-it';
import './style/penna.css';

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
    }

    init(options = {}) {
        this.options = { ...this.options, ...options };
        
        if (this.options.content) {
            this.setContent(this.options.content);
        }
    }

    setContent(markdownContent) {
        this.content = markdownContent;
        this.render();
    }

    render() {
        if (!this.element) {
            console.error(`Element with selector "${this.selector}" not found`);
            return;
        }

        this.element.innerHTML = md.render(this.content);
    }

    getContent() {
        return this.content;
    }

    updateContent(newContent) {
        this.setContent(newContent);
    }

    // 添加插件支持
    use(plugin, options = {}) {
        md.use(plugin, options);
        return this;
    }
}


export default Penna;


