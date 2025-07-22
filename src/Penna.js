import './penna.scss';
import Logger from "./utils/Logger.js";
import PennaConfig from "./PennaConfig.js";
import Editor from "./core/Editor.js";
import Previewer from "./core/Previewer.js";
import Header from "./core/Header.js";
import Footer from "./core/Footer.js";
import Toc from "./core/Toc.js";

class Penna {
    constructor(options = {}) {
        let defaultOptions = PennaConfig
        this.options = Object.assign(defaultOptions, options);
        this.element = document.querySelector(options.container);
        this._buildLayout();
        Logger.info("欢迎使用Penna")
    }

    /**
     * 构建 DOM 结构
     */
    _buildLayout() {
        this.element.classList.add('penna-container');

        this.editor = new Editor(this);
        this.previewer = new Previewer(this);
        this.header = new Header(this);
        this.footer = new Footer(this);
        this.toc = new Toc(this);


        this.element.appendChild(this.header.node);
        this.body = document.createElement('div')
        this.body.classList.add('penna-body');
        this.body.appendChild(this.editor.node);
        this.body.appendChild(this.previewer.node);
        this.body.appendChild(this.toc.node);
        this.element.appendChild(this.body);
        this.element.appendChild(this.footer.node);

    }


}

export default Penna;
