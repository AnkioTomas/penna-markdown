import type { ToolbarOptions } from "@/editor/toolbar/ToolbarOptions";
import type { Theme } from "@/theme/Theme";
import type { ToolbarContext } from "./ToolbarItem";
import { resolveToolbarGroups } from "./resolve.js";
import { renderToolbar } from "./renderToolbar.js";

export class Toolbar {
  private cleanup: (() => void) | null = null;

  constructor(
    mount: HTMLElement,
    theme: Theme,
    options: ToolbarOptions,
    focus?: () => void,
  ) {
    const ctx: ToolbarContext = {
      execute: (command, payload) => {
        theme.emit("editor:command", { command, payload });
        focus?.();
      },
      focus: () => focus?.(),
    };

    const grouped = resolveToolbarGroups(options);
    const groups = grouped.map((g) => g.items);

    this.cleanup = renderToolbar(mount, {
      groups,
      ctx,
    });
  }

  destroy(): void {
    this.cleanup?.();
    this.cleanup = null;
  }
}
