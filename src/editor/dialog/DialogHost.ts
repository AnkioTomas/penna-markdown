import type { Theme } from "@/theme/Theme";
import { renderBadgeDialog } from "./BadgeDialog.js";
import { renderLinkDialog } from "./LinkDialog.js";
import { renderTableDialog } from "./TableDialog.js";

export class DialogHost {
  private readonly root: HTMLElement;
  private readonly theme: Theme;
  private readonly offs: (() => void)[] = [];
  private cleanupForm: (() => void) | null = null;
  private activeId: string | null = null;

  constructor(mount: HTMLElement, theme: Theme) {
    this.theme = theme;
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
      theme.on("editor:dialog:open", (payload) => {
        const p = payload as {
          id: string;
          type: "table" | "link" | "badge";
          props?: Record<string, unknown>;
        };
        this.show(p.id, p.type, p.props);
      }),
    );
  }

  private show(id: string, type: "table" | "link" | "badge", props?: Record<string, unknown>) {
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
      this.theme.emit("editor:dialog:result", { id: resultId, cancelled, data });
    };

    if (type === "table") {
      this.cleanupForm = renderTableDialog(body, {
        onSubmit: (data) => done(false, data),
        onCancel: () => done(true),
      });
    } else if (type === "link") {
      this.cleanupForm = renderLinkDialog(
        body,
        { text: String(props?.text ?? ""), url: String(props?.url ?? "") },
        { onSubmit: (data) => done(false, data), onCancel: () => done(true) },
      );
    } else {
      this.cleanupForm = renderBadgeDialog(body, {
        onSubmit: (data) => done(false, data),
        onCancel: () => done(true),
      });
    }
  }

  private dismiss(silent: boolean) {
    if (!this.activeId) {
      this.teardown();
      return;
    }
    const id = this.activeId;
    
    // Add closing animation class
    this.root.classList.add("is-closing");
    
    // Wait for animation to finish before teardown
    setTimeout(() => {
      this.root.classList.remove("is-closing");
      this.teardown();
      if (silent) this.theme.emit("editor:dialog:result", { id, cancelled: true });
    }, 200); // 200ms matches the CSS animation duration
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
