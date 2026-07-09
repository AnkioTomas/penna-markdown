/**
 * 弹窗命令协议。
 *
 * 实现 {@link DialogCapableCommand} 的命令可同时提供 `renderDialog`，
 * 由 {@link buildDialogRenderers} 收集后供 {@link DialogHost} 渲染。
 */
import type { DialogType } from "@/editor/commands/dialogTypes";

/** 弹窗提交/取消回调，由 DialogHost 注入。 */
export interface DialogCallbacks<TResult = unknown> {
  /** 用户确认提交，携带表单数据。 */
  onSubmit: (data: TResult) => void;
  /** 用户取消或按 Esc 关闭。 */
  onCancel: () => void;
}

/**
 * 弹窗渲染函数签名。
 * @returns 清理函数，在弹窗关闭时调用
 */
export type DialogRenderer = (
  host: HTMLElement,
  props: Record<string, unknown>,
  callbacks: DialogCallbacks,
) => () => void;

/**
 * 带弹窗能力的命令扩展接口。
 * 与 {@link Command} 组合使用（class implements Command, DialogCapableCommand）。
 */
export interface DialogCapableCommand {
  /** 弹窗类型 id，对应 {@link DialogType}。 */
  readonly dialogType: DialogType;
  /** 将弹窗 DOM 挂载到 host 元素。 */
  renderDialog: DialogRenderer;
}

/** 类型守卫：判断对象是否实现了弹窗能力。 */
export function isDialogCapable(cmd: unknown): cmd is DialogCapableCommand {
  return (
    typeof cmd === "object" &&
    cmd !== null &&
    "dialogType" in cmd &&
    "renderDialog" in cmd &&
    typeof (cmd as DialogCapableCommand).renderDialog === "function"
  );
}

/**
 * 从命令注册表扫描所有带弹窗的命令，构建 type → renderDialog 映射。
 * 供 `DialogHost` 通过 `DIALOG_RENDERERS[type]` 查找渲染器。
 */
export function buildDialogRenderers(
  commands: Record<string, unknown>,
): Partial<Record<DialogType, DialogRenderer>> {
  const map: Partial<Record<DialogType, DialogRenderer>> = {};
  for (const cmd of Object.values(commands)) {
    if (isDialogCapable(cmd)) {
      map[cmd.dialogType] = cmd.renderDialog.bind(cmd);
    }
  }
  return map;
}
