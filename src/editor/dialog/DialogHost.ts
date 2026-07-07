import type { Theme } from "@/theme/Theme";
import { renderAttrDialog } from "./AttrDialog.js";
import { renderBadgeDialog } from "./BadgeDialog.js";
import { renderCodeBlockDialog } from "./CodeBlockDialog.js";
import { renderCollapseDialog } from "./CollapseDialog.js";
import { renderEmojiDialog } from "./EmojiDialog.js";
import { renderFootnoteDialog } from "./FootnoteDialog.js";
import { renderFrontmatterDialog } from "./FrontmatterDialog.js";
import { renderLinkDialog } from "./LinkDialog.js";
import { renderMediaDialog } from "./MediaDialog.js";
import { renderTableDialog } from "./TableDialog.js";
import { renderTimelineDialog } from "./TimelineDialog.js";
import type { DialogType } from "./requestDialog.js";

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
      this.theme.emit("editor:dialog:result", {
        id: resultId,
        cancelled,
        data,
      });
    };

    const cbs = {
      onSubmit: (data: unknown) => done(false, data),
      onCancel: () => done(true),
    };

    switch (type) {
      case "table":
        this.cleanupForm = renderTableDialog(body, cbs as never);
        break;
      case "link":
        this.cleanupForm = renderLinkDialog(
          body,
          { text: String(props?.text ?? ""), url: String(props?.url ?? "") },
          cbs as never,
        );
        break;
      case "badge":
        this.cleanupForm = renderBadgeDialog(body, cbs as never);
        break;
      case "media":
        this.cleanupForm = renderMediaDialog(body, props ?? {}, cbs as never);
        break;
      case "emoji":
        this.cleanupForm = renderEmojiDialog(body, cbs as never);
        break;
      case "attr":
        this.cleanupForm = renderAttrDialog(body, props ?? {}, cbs as never);
        break;
      case "footnote":
        this.cleanupForm = renderFootnoteDialog(
          body,
          props ?? {},
          cbs as never,
        );
        break;
      case "codeBlock":
        this.cleanupForm = renderCodeBlockDialog(
          body,
          props ?? {},
          cbs as never,
        );
        break;
      case "frontmatter":
        this.cleanupForm = renderFrontmatterDialog(
          body,
          props ?? {},
          cbs as never,
        );
        break;
      case "collapse":
        this.cleanupForm = renderCollapseDialog(body, cbs as never);
        break;
      case "timeline":
        this.cleanupForm = renderTimelineDialog(
          body,
          props ?? {},
          cbs as never,
        );
        break;
      default:
        done(true);
    }
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
        this.theme.emit("editor:dialog:result", { id, cancelled: true });
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
