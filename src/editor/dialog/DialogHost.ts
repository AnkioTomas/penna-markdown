import type { EventBus } from "@/core/event/EventBus";
import { DIALOG_RENDERERS } from "@/editor/commands/index.js";
import type { DialogType } from "@/editor/commands/dialogTypes.js";

export class DialogHost {
  private readonly root: HTMLElement;
  private readonly eventBus: EventBus;
  private readonly offs: (() => void)[] = [];
  private cleanupForm: (() => void) | null = null;
  private activeId: string | null = null;

  constructor(mount: HTMLElement, eventBus: EventBus) {
    this.eventBus = eventBus;
    this.root = document.createElement("div");
    this.root.className = "cherry-dialog-host";
    this.root.hidden = true;
    mount.appendChild(this.root);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && this.activeId) this.dismiss(true);
    };
    document.addEventListener("keydown", onKey);
    this.offs.push(() => document.removeEventListener("keydown", onKey));

    this.offs.push(
      eventBus.on("editor:dialog:open", (payload) => {
        const p = payload as {
          id: string;
          type: DialogType;
          props?: Record<string, unknown>;
        };
        this.show(p.id, p.type, p.props);
      }),
    );
  }

  private show(id: string, type: DialogType, props?: Record<string, unknown>) {
    this.dismiss(true);
    this.activeId = id;
    this.root.hidden = false;

    const backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "cherry-dialog-backdrop";
    backdrop.setAttribute("aria-label", "关闭");
    backdrop.addEventListener("click", () => this.dismiss(true));

    const panel = document.createElement("div");
    panel.className = "cherry-dialog-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    const body = document.createElement("div");
    body.className = "cherry-dialog-body";
    panel.append(body);
    this.root.replaceChildren(backdrop, panel);

    const done = (cancelled: boolean, data?: unknown) => {
      if (!this.activeId) return;
      const resultId = this.activeId;
      this.teardown();
      this.eventBus.emit("editor:dialog:result", {
        id: resultId,
        cancelled,
        data,
      });
    };

    const cbs = {
      onSubmit: (data: unknown) => done(false, data),
      onCancel: () => done(true),
    };

    const render = DIALOG_RENDERERS[type];
    if (!render) {
      done(true);
      return;
    }
    this.cleanupForm = render(body, props ?? {}, cbs);
  }

  private dismiss(silent: boolean) {
    if (!this.activeId) {
      this.teardown();
      return;
    }
    const id = this.activeId;
    this.root.classList.add("is-closing");
    setTimeout(() => {
      this.root.classList.remove("is-closing");
      this.teardown();
      if (silent)
        this.eventBus.emit("editor:dialog:result", { id, cancelled: true });
    }, 200);
  }

  private teardown() {
    this.cleanupForm?.();
    this.cleanupForm = null;
    this.activeId = null;
    this.root.hidden = true;
    this.root.replaceChildren();
  }

  destroy(): void {
    this.teardown();
    this.root.remove();
    for (const off of this.offs) off();
    this.offs.length = 0;
  }
}
