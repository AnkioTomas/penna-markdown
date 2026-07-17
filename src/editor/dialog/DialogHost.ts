import type { EventBus } from "@/core/event/EventBus";
import { DIALOG_RENDERERS } from "@/editor/commands/index.js";
import type { DialogType } from "@/editor/commands/dialogTypes.js";
import type {
  EditorDialogOpenPayload,
  EditorDialogResultPayload,
} from "@/editor/events";

/** 管理编辑器弹窗生命周期，并将结果通过事件总线回传给请求方。 */
export class DialogHost {
  private readonly root: HTMLElement;
  private readonly eventBus: EventBus;
  private readonly offs: (() => void)[] = [];
  private cleanupForm: (() => void) | null = null;
  private activeId: string | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * 创建弹窗宿主，并开始监听弹窗打开事件。
   *
   * @param mount 宿主 DOM 的挂载容器。
   * @param eventBus 用于接收打开请求和发布结果的事件总线。
   */
  constructor(mount: HTMLElement, eventBus: EventBus) {
    this.eventBus = eventBus;
    this.root = document.createElement("div");
    this.root.className = "penna-dialog-host";
    this.root.hidden = true;
    mount.appendChild(this.root);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && this.activeId) this.dismiss(true);
    };
    document.addEventListener("keydown", onKey);
    this.offs.push(() => document.removeEventListener("keydown", onKey));

    this.offs.push(
      eventBus.on<EditorDialogOpenPayload>("editor:dialog:open", (payload) => {
        this.show(payload.id, payload.type, payload.props);
      }),
    );
  }

  /**
   * 渲染指定类型的弹窗，并将其结果回传到事件总线。
   *
   * @param id 当前弹窗请求的唯一标识。
   * @param type 要渲染的弹窗类型。
   * @param props 传递给弹窗渲染器的可选属性。
   */
  private show(id: string, type: DialogType, props?: Record<string, unknown>) {
    this.cancelActive();
    this.activeId = id;
    this.root.hidden = false;

    const backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "penna-dialog-backdrop";
    backdrop.setAttribute("aria-label", "关闭");
    backdrop.addEventListener("click", () => this.dismiss(true));

    const panel = document.createElement("div");
    panel.className = "penna-dialog-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    const body = document.createElement("div");
    body.className = "penna-dialog-body";
    panel.append(body);
    this.root.replaceChildren(backdrop, panel);

    const done = (cancelled: boolean, data?: unknown) => {
      if (!this.activeId) return;
      const resultId = this.activeId;
      this.teardown();
      const result: EditorDialogResultPayload = {
        id: resultId,
        cancelled,
        data,
      };
      this.eventBus.emit("editor:dialog:result", result);
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

  /**
   * 关闭当前弹窗，并按需发布取消结果。
   *
   * @param silent 是否将关闭作为取消结果通知请求方。
   */
  private dismiss(silent: boolean) {
    const id = this.activeId;
    if (!id) return;

    this.activeId = null;
    this.cleanupForm?.();
    this.cleanupForm = null;
    if (silent) {
      const result: EditorDialogResultPayload = { id, cancelled: true };
      this.eventBus.emit("editor:dialog:result", result);
    }

    this.root.classList.add("is-closing");
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      if (this.activeId) return;
      this.root.classList.remove("is-closing");
      this.teardown();
    }, 200);
  }

  /**
   * 在替换宿主内容前取消当前或正在关闭的弹窗。
   *
   * 副作用：会清除关闭定时器、运行表单清理函数，并为活动请求发布取消结果。
   */
  private cancelActive(): void {
    if (this.closeTimer != null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }

    const id = this.activeId;
    if (id) {
      this.activeId = null;
      const result: EditorDialogResultPayload = { id, cancelled: true };
      this.eventBus.emit("editor:dialog:result", result);
    }
    this.root.classList.remove("is-closing");
    this.teardown();
  }

  /** 清理当前表单和宿主内容，并恢复隐藏状态。 */
  private teardown() {
    this.cleanupForm?.();
    this.cleanupForm = null;
    this.activeId = null;
    this.root.hidden = true;
    this.root.replaceChildren();
  }

  /** 取消活动弹窗、移除宿主节点并解除全部事件监听。 */
  destroy(): void {
    this.cancelActive();
    this.root.remove();
    for (const off of this.offs) off();
    this.offs.length = 0;
  }
}
