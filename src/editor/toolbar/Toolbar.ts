import type { ToolbarOptions } from "@/editor/toolbar/ToolbarOptions";
import type { Theme } from "@/theme/Theme";
import type { EditorLayoutMode } from "@/editor/Layout";
import type { ToolbarContext } from "./ToolbarItem";
import { resolveToolbarGroups } from "./resolve.js";
import { renderToolbar } from "./renderToolbar.js";

export interface ToolbarParams {
  mount: HTMLElement;
  theme: Theme;
  options: ToolbarOptions;
  focus?: () => void;
  getLayout?: () => EditorLayoutMode;
}

export class Toolbar {
  private cleanup: (() => void) | null = null;
  private layoutMode: EditorLayoutMode = "split";
  private readonly offs: (() => void)[] = [];

  constructor({ mount, theme, options, focus, getLayout }: ToolbarParams) {
    this.layoutMode = getLayout?.() ?? "split";

    const ctx: ToolbarContext = {
      execute: (command, payload) => {
        theme.emit("editor:command", { command, payload });
        focus?.();
      },
      focus: () => focus?.(),
      setLayout: (mode) => {
        this.layoutMode = mode;
        theme.emit("cherry:layout", { mode });
      },
      getLayout: () => this.layoutMode,
      onLayoutButton: () => {},
    };

    const grouped = resolveToolbarGroups(options);
    const layoutGroup = grouped[grouped.length - 1];
    const layoutItem =
      layoutGroup?.items.length === 1 && layoutGroup.items[0]?.type === "layout"
        ? layoutGroup.items[0]
        : undefined;
    const groups = (layoutItem ? grouped.slice(0, -1) : grouped).map((g) => g.items);

    this.cleanup = renderToolbar(mount, {
      groups,
      ctx,
      layoutMode: this.layoutMode,
      layoutItem,
    });

    this.offs.push(
      theme.on("cherry:layout", (payload) => {
        const { mode } = payload as { mode: EditorLayoutMode };
        this.layoutMode = mode;
      }),
    );
  }

  destroy(): void {
    for (const off of this.offs) off();
    this.offs.length = 0;
    this.cleanup?.();
    this.cleanup = null;
  }
}
