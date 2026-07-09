import type { ToolbarOptions } from "@/editor/toolbar/ToolbarOptions";
import type { Theme } from "@/theme/Theme";
import type { ToolbarContext } from "./ToolbarItem";
import { resolveToolbarItems } from "@/editor/toolbar/resolve";
import { renderToolbar } from "@/editor/toolbar/renderToolbar";

export class Toolbar {
  private cleanup: (() => void) | null = null;

  constructor(
    mount: HTMLElement,
    theme: Theme,
    options: ToolbarOptions,
    focus?: () => void,
  ) {
    const ctx: ToolbarContext = {
      theme,
      execute: (command, payload) => {
        theme.emit("editor:command", { command, payload });
        focus?.();
      },
      focus: () => focus?.(),
    };

    const items = resolveToolbarItems(options);

    this.cleanup = renderToolbar(mount, items, ctx, options.onClick);
  }

  destroy(): void {
    this.cleanup?.();
    this.cleanup = null;
  }
}
