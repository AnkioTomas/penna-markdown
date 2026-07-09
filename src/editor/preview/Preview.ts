import { Transaction } from "@codemirror/state";
import { Renderer } from "@/renderer/Renderer";
import type { PreviewOptions } from "./PreviewOptions";
import {
  THEME_EVENT_LIGHT_DARK,
  THEME_EVENT_SKIN,
  type Theme,
} from "@/theme/Theme";
import { CherryChangeLineSet } from "@/renderer/incremental/CherryChangeSet";
import { ParserStore } from "@/transformer/core/ParserStore";

export class Preview {
  private readonly theme: Theme;
  private readonly renderer: Renderer;
  private lastMarkdown = "";
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs: number = 50;
  private readonly offs = new Set<() => void>();

  constructor(mount: HTMLElement, theme: Theme, options: PreviewOptions = {}) {
    this.theme = theme;
    this.renderer = new Renderer({
      mount,
      theme,
      inlineParsers: options.inlineParsers,
      blockParsers: options.blockParsers,
    });

    this.offs.add(
      theme.on("editor:change", (payload) => {
        const { markdown, tr } = payload as {
          markdown: string;
          tr: Transaction;
        };
        this.onEditorChange(markdown, tr);
      }),
    );
    this.offs.add(
      theme.on(THEME_EVENT_LIGHT_DARK, () => {
        if (this.lastMarkdown) this.onEditorChange(this.lastMarkdown);
      }),
    );
    this.offs.add(
      theme.on(THEME_EVENT_SKIN, () => {
        if (this.lastMarkdown) this.onEditorChange(this.lastMarkdown);
      }),
    );
    this.offs.add(
      theme.on("cherry:layout", (payload: any) => {
        if (payload.mode === "preview" && options.maxWidth) {
          const maxWidth =
            typeof options.maxWidth === "number"
              ? `${options.maxWidth}px`
              : options.maxWidth;
          mount.style.maxWidth = maxWidth;
          mount.style.marginLeft = "auto";
          mount.style.marginRight = "auto";
          if (mount.parentElement) {
            mount.parentElement.style.backgroundColor = "var(--cherry-c-bg)";
          }
        } else {
          mount.style.maxWidth = "";
          mount.style.marginLeft = "";
          mount.style.marginRight = "";
          if (mount.parentElement) {
            mount.parentElement.style.backgroundColor = "";
          }
        }
      }),
    );
    this.offs.add(
      theme.on("preview:force-refresh", () => {
        if (this.lastMarkdown) {
          this.pendingTransactions = [];
          const mount = this.renderer.getMount();
          const scrollTop = mount.scrollTop;

          const result = this.renderer.renderFull(this.lastMarkdown);

          // DOM 替换后恢复滚动位置，避免强制重置到顶部导致滚动同步引擎误判
          mount.scrollTop = scrollTop;

          this.theme.emit("preview:rendered", {
            markdown: this.lastMarkdown,
            html: result.html,
            ast: result.ast,
            blocks: result.blocks,
            partial: false,
            changedStartLines: [],
          });
        }
      }),
    );
  }

  getStore() {
    return this.renderer.getStore() ?? new ParserStore([]);
  }

  private pendingTransactions: Transaction[] = [];

  private onEditorChange(
    markdown: string,
    tr?: Transaction | readonly Transaction[],
  ): void {
    this.lastMarkdown = markdown;
    if (tr) {
      if (Array.isArray(tr)) {
        this.pendingTransactions.push(...tr);
      } else {
        this.pendingTransactions.push(tr as Transaction);
      }
    }

    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    const run = (): void => {
      this.debounceTimer = null;

      const transactionsToProcess = [...this.pendingTransactions];
      this.pendingTransactions = [];

      const result = this.renderer.render(
        markdown,
        this.convert2CherryChanges(
          transactionsToProcess.length > 0 ? transactionsToProcess : undefined,
        ),
      );
      this.theme.emit("preview:rendered", {
        markdown,
        html: result.html,
        ast: result.ast,
        blocks: result.blocks,
        partial: result.partial ?? false,
        changedStartLines: result.changedStartLines ?? [],
      });
    };

    if (this.rendererNeedsFirstPaint()) {
      run();
      return;
    }

    this.debounceTimer = setTimeout(run, this.debounceMs);
  }

  private rendererNeedsFirstPaint(): boolean {
    return this.renderer.getMount().childElementCount === 0;
  }

  private convert2CherryChanges(
    tr?: Transaction | readonly Transaction[],
  ): CherryChangeLineSet[] | undefined {
    if (!tr) return undefined;

    const transactions = Array.isArray(tr) ? tr : [tr];
    const validTrs = transactions.filter((t) => t.docChanged);
    if (validTrs.length === 0) return undefined;

    let mergedChanges = validTrs[0]!.changes;
    for (let i = 1; i < validTrs.length; i++) {
      mergedChanges = mergedChanges.compose(validTrs[i]!.changes);
    }

    const list: CherryChangeLineSet[] = [];
    const oldDoc = validTrs[0]!.startState.doc;
    const newDoc = validTrs[validTrs.length - 1]!.state.doc;

    mergedChanges.iterChanges((fromA, toA, fromB, toB, inserted) => {
      const fromLineA = oldDoc.lineAt(fromA).number;
      const toLineA = oldDoc.lineAt(toA).number;

      const fromLineB = newDoc.lineAt(fromB).number;
      const toLineB = newDoc.lineAt(toB).number;

      const deletedLines = toLineA - fromLineA;
      const insertedLines = toLineB - fromLineB;

      const isFullDocument = fromA === 0 && toA === oldDoc.length;

      list.push({
        fromA: fromLineA,
        toA: toLineA,
        fromB: fromLineB,
        toB: toLineB,
        deletedLines,
        insertedLines,
        isFullDocument,
      });
    });

    return list.length > 0 ? list : undefined;
  }

  destroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    for (const off of this.offs) off();
    this.offs.clear();
    this.renderer.destroy();
  }
}
