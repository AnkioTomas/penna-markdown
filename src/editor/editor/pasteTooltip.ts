import { StateField, StateEffect } from "@codemirror/state";
import { EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";

// 定义粘贴的状态信息
export interface PasteState {
  from: number;
  to: number;
  plainText: string;
  markdownText: string;
  active: "plain" | "markdown";
}

export const setPasteState = StateEffect.define<PasteState | null>();

export const pasteStateField = StateField.define<PasteState | null>({
  create() {
    return null;
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setPasteState)) {
        return effect.value;
      }
    }

    // 任何非我们主动修改的文档变更或选区变化，都销毁悬浮窗
    if (value && (tr.docChanged || tr.selection)) {
      return null;
    }

    return value;
  },
});

export const pasteTooltipPlugin = ViewPlugin.fromClass(
  class {
    dom: HTMLElement;
    btnPlain: HTMLButtonElement;
    btnMd: HTMLButtonElement;
    view: EditorView;

    /**
     * 创建粘贴格式切换浮层并挂载到编辑器。
     *
     * @param view 浮层关联的编辑器视图。
     */
    constructor(view: EditorView) {
      this.view = view;
      this.dom = document.createElement("div");
      this.dom.className = "cherry-paste-switcher";
      this.dom.style.position = "absolute";
      this.dom.style.bottom = "16px";
      this.dom.style.right = "16px";
      this.dom.style.display = "none";
      this.dom.style.gap = "6px";
      this.dom.style.padding = "6px";
      this.dom.style.backgroundColor = "var(--cherry-c-bg-elevated)";
      this.dom.style.border = "1px solid var(--cherry-c-border-soft)";
      this.dom.style.borderRadius = "6px";
      // Use standard CSS variables for shadow if they exist, or a computed shadow from standard text variables
      this.dom.style.boxShadow =
        "0 4px 16px color-mix(in srgb, var(--cherry-c-text-3) 20%, transparent)";
      this.dom.style.zIndex = "100";
      this.dom.style.fontFamily = "var(--cherry-font-family)";
      this.dom.style.fontSize = "12px";

      const createBtn = (text: string) => {
        const btn = document.createElement("button");
        btn.textContent = text;
        btn.style.cursor = "pointer";
        btn.style.padding = "4px 10px";
        btn.style.border = "1px solid transparent";
        btn.style.borderRadius = "4px";
        btn.style.outline = "none";
        btn.style.transition = "all 0.2s ease";
        btn.style.fontFamily = "var(--cherry-font-family)";
        return btn;
      };

      this.btnPlain = createBtn("保留原文");
      this.btnMd = createBtn("Markdown");

      this.btnPlain.onclick = (e) => this.handleSwitch(e, "plain");
      this.btnMd.onclick = (e) => this.handleSwitch(e, "markdown");

      this.dom.appendChild(this.btnPlain);
      this.dom.appendChild(this.btnMd);

      view.dom.appendChild(this.dom);

      this.syncUI(view.state.field(pasteStateField));
    }

    /**
     * 将刚粘贴的内容切换为原文或转换后的 Markdown。
     *
     * @param e 触发切换的鼠标事件。
     * @param targetMode 要应用的粘贴文本格式。
     */
    handleSwitch(e: MouseEvent, targetMode: "plain" | "markdown") {
      e.preventDefault();
      e.stopPropagation();
      const state = this.view.state.field(pasteStateField);
      if (!state || state.active === targetMode) return;

      const newText =
        targetMode === "plain" ? state.plainText : state.markdownText;
      this.view.dispatch({
        changes: { from: state.from, to: state.to, insert: newText },
        effects: setPasteState.of({
          ...state,
          to: state.from + newText.length,
          active: targetMode,
        }),
      });
      this.view.focus();
    }

    /**
     * 在粘贴状态变化时同步浮层显示。
     *
     * @param update CodeMirror 视图更新信息。
     */
    update(update: ViewUpdate) {
      const state = update.state.field(pasteStateField);
      const prevState = update.startState.field(pasteStateField);
      if (state !== prevState) {
        this.syncUI(state);
      }
    }

    /**
     * 根据当前粘贴状态显示、隐藏并标记格式切换按钮。
     *
     * @param state 当前粘贴状态；为空时隐藏浮层。
     */
    syncUI(state: PasteState | null) {
      if (!state) {
        this.dom.style.display = "none";
        return;
      }
      this.dom.style.display = "flex";

      const updateBtnStyle = (btn: HTMLButtonElement, isActive: boolean) => {
        btn.style.backgroundColor = isActive
          ? "var(--cherry-c-brand-1)"
          : "transparent";
        btn.style.color = isActive
          ? "var(--cherry-c-bg)"
          : "var(--cherry-c-text-2)";
        btn.style.borderColor = isActive
          ? "var(--cherry-c-brand-1)"
          : "var(--cherry-c-border-soft)";
      };

      updateBtnStyle(this.btnPlain, state.active === "plain");
      updateBtnStyle(this.btnMd, state.active === "markdown");
    }

    /** 从编辑器 DOM 中移除粘贴格式切换浮层。 */
    destroy() {
      this.dom.remove();
    }
  },
);
