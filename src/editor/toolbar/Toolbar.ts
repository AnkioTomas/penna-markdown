import type { ToolbarOptions } from "@/editor/toolbar/ToolbarOptions";
import type { EventBus } from "@/core/event/EventBus";
import type { ToolbarContext } from "./ToolbarItem";
import { resolveToolbarItems } from "@/editor/toolbar/resolve";
import { renderToolbar } from "@/editor/toolbar/renderToolbar";

export class Toolbar {
  private cleanup: (() => void) | null = null;

  constructor(
    mount: HTMLElement,
    eventBus: EventBus,
    options: ToolbarOptions,
    focus?: () => void,
  ) {
    const ctx: ToolbarContext = {
      eventBus,
      execute: (command, payload) => {
        eventBus.emit("editor:command", { command, payload });
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
