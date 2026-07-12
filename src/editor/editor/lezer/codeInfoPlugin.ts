import {
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

export const codeInfoPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    /**
     * 为当前可见代码信息节点创建初始装饰。
     *
     * @param view 插件关联的编辑器视图。
     */
    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    /**
     * 在文档或可视区域变化后重建代码信息装饰。
     *
     * @param update CodeMirror 视图更新信息。
     */
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    /**
     * 为可见 `CodeInfo` 节点中的属性键、值和标志构建语法装饰。
     *
     * @param view 要读取语法树的编辑器视图。
     * @returns 可应用到编辑器的装饰集合。
     */
    buildDecorations(view: EditorView) {
      const builder = new RangeSetBuilder<Decoration>();
      for (const { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
          from,
          to,
          enter(node) {
            if (node.name === "CodeInfo") {
              const text = view.state.sliceDoc(node.from, node.to);
              // Ignore the language string which is the first word.
              // Match key="value", :flag, or other attributes.
              const regex = /([a-zA-Z0-9_-]+)="([^"]*)"|(:[a-zA-Z0-9_-]+)/g;
              let match;
              while ((match = regex.exec(text)) !== null) {
                const start = node.from + match.index;
                if (match[1]) {
                  // key="value"
                  const keyEnd = start + match[1].length;
                  builder.add(
                    start,
                    keyEnd,
                    Decoration.mark({ class: "cm-ext-codeinfo-key" }),
                  );
                  const valStart = keyEnd + 2; // skip ="
                  const valEnd = valStart + match[2].length;
                  builder.add(
                    valStart,
                    valEnd,
                    Decoration.mark({ class: "cm-ext-codeinfo-value" }),
                  );
                } else if (match[3]) {
                  // flag (e.g. :collapsed-lines)
                  const flagEnd = start + match[3].length;
                  builder.add(
                    start,
                    flagEnd,
                    Decoration.mark({ class: "cm-ext-codeinfo-flag" }),
                  );
                }
              }
            }
          },
        });
      }
      return builder.finish();
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);
