import {copyText} from "@/renderer/code/copy";
import {decodeBase64Utf8} from "@/transformer/utils/base64.js";

export class CodeListener {
    private readonly onClickBound = (e: MouseEvent) => this.onClick(e);

    constructor(private readonly render: HTMLElement) {
        this.render.addEventListener("click", this.onClickBound);
    }

    private onClick(e: MouseEvent) {
        const target = e.target as HTMLElement;

        const expand = target.closest("button.cherry-code-block__expand");
        if (expand) {
            e.preventDefault();
            this.handleExpand(expand as HTMLButtonElement);
            return;
        }

        const copy = target.closest("button.cherry-copy-code-button");
        if (copy) {
            this.handleCopy(copy as HTMLButtonElement);
            return;
        }
    }


    async handleCopy(btn: HTMLButtonElement) {
        const doc = btn.ownerDocument;
        const panel = btn.closest(".cherry-code-block__panel");
        if (!panel) return;
        const codeEl = panel.querySelector<HTMLElement>("code[data-cherry-code]");
        if (!codeEl) return;
        const code = codeEl.textContent;

        try {
            await copyText(code, doc);
        } catch {
            return;
        }

        const copiedLabel = btn.getAttribute("data-copied") || "已复制";
        const originalLabel = btn.getAttribute("aria-label") || "复制代码";
        btn.classList.add("is-copied");
        btn.setAttribute("aria-label", copiedLabel);

        const timer = doc.defaultView?.setTimeout ?? setTimeout;
        timer(() => {
            btn.classList.remove("is-copied");
            btn.setAttribute("aria-label", originalLabel);
        }, 2000);
    }

    handleExpand(btn: HTMLButtonElement) {
        const panel = btn.closest(".cherry-code-block__panel--collapsible");
        if (!panel) return;

        const label = btn.querySelector(".cherry-code-block__expand-label");
        const isCollapsed = panel.classList.toggle("cherry-code-block__panel--collapsed");
        btn.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
        if (label) {
            label.textContent = isCollapsed ? "展开代码" : "收起代码";
        }
    }

    destroy() {
        this.render.removeEventListener("click", this.onClickBound);
    }
}