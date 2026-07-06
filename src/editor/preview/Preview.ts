import {Transaction} from "@codemirror/state";
import {Renderer} from "@/renderer/Renderer";
import type {PreviewOptions} from "./PreviewOptions";
import {
    THEME_EVENT_LIGHT_DARK,
    THEME_EVENT_SKIN,
    type Theme,
} from "@/theme/Theme";
import {CherryChangeLineSet} from "@/renderer/incremental/CherryChangeSet";

export class Preview {
    private readonly theme: Theme;
    private readonly renderer: Renderer;
    private lastMarkdown = "";
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly debounceMs: number = 50;
    private readonly offs = new Set<() => void>();

    constructor(
        mount: HTMLElement,
        theme: Theme,
        options: PreviewOptions = {},
    ) {
        this.theme = theme;
        this.renderer = new Renderer({
            mount,
            theme,
            inlineParsers: options.inlineParsers,
            blockParsers: options.blockParsers,
        });

        this.offs.add(theme.on("editor:change", (payload) => {
            let {markdown, tr} = payload as { markdown: string, tr: Transaction };
            this.onEditorChange(markdown, tr);
        }));
        this.offs.add(theme.on(THEME_EVENT_LIGHT_DARK, () => {
            if (this.lastMarkdown) this.onEditorChange(this.lastMarkdown,);
        }));
        this.offs.add(theme.on(THEME_EVENT_SKIN, () => {
            if (this.lastMarkdown) this.onEditorChange(this.lastMarkdown,);
        }));
    }

    private onEditorChange(markdown: string, tr?: Transaction): void {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);

        const run = (): void => {
            this.debounceTimer = null;
            const result = this.renderer.render(
                markdown,
                this.convert2CherryChanges(tr),
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
        const list: CherryChangeLineSet[] = [];

        for (const transaction of transactions) {
            if (!transaction.docChanged) continue;

            transaction.changes.iterChanges((fromA, toA, fromB, toB) => {
                const oldDoc = transaction.startState.doc;
                const newDoc = transaction.state.doc;

                const fromLineA = oldDoc.lineAt(fromA).number;
                const toLineA = oldDoc.lineAt(Math.max(fromA, toA - 1)).number;

                const fromLineB = newDoc.lineAt(fromB).number;
                const toLineB = newDoc.lineAt(Math.max(fromB, toB - 1)).number;

                list.push({
                    fromA: fromLineA,
                    toA: toLineA,
                    fromB: fromLineB,
                    toB: toLineB,
                });
            });
        }

        return list.length > 0 ? list : undefined;
    }

    destroy(): void {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        for (const off of this.offs) off();
        this.offs.clear();
        this.renderer.destroy();
    }
}
