import type { EventBus } from "@/core/event/EventBus";
import type {
  DialogResultMap,
  DialogType,
} from "@/editor/commands/dialogTypes.js";
import type {
  EditorDialogOpenPayload,
  EditorDialogResultPayload,
} from "@/editor/events";

export type {
  DialogType,
  DialogResultMap,
} from "@/editor/commands/dialogTypes.js";

let dialogCounter = 0;

/**
 * 请求宿主打开弹窗，并等待与请求 ID 匹配的提交或取消结果。
 *
 * @param eventBus 用于发送请求和接收结果的事件总线。
 * @param type 要打开的弹窗类型。
 * @param props 传递给弹窗的可选属性。
 * @returns 提交的类型化结果；取消时为 `null`。
 */
export function requestDialog<T extends DialogType>(
  eventBus: EventBus,
  type: T,
  props?: Record<string, unknown>,
): Promise<DialogResultMap[T] | null> {
  const id = `dlg-${++dialogCounter}-${Date.now()}`;
  return new Promise((resolve) => {
    const off = eventBus.on<EditorDialogResultPayload>(
      "editor:dialog:result",
      (payload) => {
        if (payload.id !== id) return;
        off();
        resolve(
          payload.cancelled
            ? null
            : ((payload.data as DialogResultMap[T] | undefined) ?? null),
        );
      },
    );
    const open: EditorDialogOpenPayload = { id, type, props };
    eventBus.emit("editor:dialog:open", open);
  });
}
