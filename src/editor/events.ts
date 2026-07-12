/**
 * 编辑器子系统事件载荷契约。
 *
 * 只描述类型，不放逻辑。订阅侧用 `eventBus.on<Payload>(...)` 或具名类型收紧，
 * 禁止业务路径上的 `payload: any`。
 */
import type { Transaction } from "@codemirror/state";
import type { EditorLayoutMode } from "@/editor/Layout";
import type { DialogType } from "@/editor/commands/dialogTypes";
import type { BlockIndex } from "@/renderer/incremental/BlockIndex";
import type { MarkdownNode } from "@/transformer/core/MarkdownNode";
import type { TocItem } from "@/renderer/toc/TocItem";

/** 编辑器文档变更：Markdown 唯一源 + 可选 CM 事务（供增量渲染）。 */
export interface EditorChangePayload {
  markdown: string;
  /** 首屏 / 外部 set 可能无 tr；有变更时为 Transaction 数组。 */
  tr?: readonly Transaction[];
}

/** 预览渲染完成，供 TOC / 滚动同步消费。 */
export interface PreviewRenderedPayload {
  markdown: string;
  html: string;
  ast: MarkdownNode;
  blocks: BlockIndex[];
  toc: TocItem[];
  partial: boolean;
  changedStartLines: number[];
  /** debug：本次全量渲染耗时（ms）；仅全量路径设置 */
  fullRenderMs?: number;
  /** debug：本次增量渲染耗时（ms）；仅增量路径设置 */
  incrementalRenderMs?: number;
}

/** 工具栏 / 快捷键 → CommandBridge / AI。 */
export interface EditorCommandPayload {
  command: string;
  payload?: unknown;
}

/** 布局模式切换（工具栏 / 状态栏 / Cherry）。 */
export interface CherryLayoutPayload {
  mode: EditorLayoutMode;
}

/** Divider 实际应用布局后（含 prev）。 */
export interface EditorLayoutPayload {
  mode: EditorLayoutMode;
  prev: EditorLayoutMode;
}

/** 侧边栏显隐。 */
export interface CherrySidebarPayload {
  show: boolean;
}

/** 分栏比例变更。 */
export interface EditorSplitPayload {
  split: number;
}

/** TOC 点击跳转。 */
export interface SidebarTocClickPayload {
  id: string;
}

/** 弹窗打开。 */
export interface EditorDialogOpenPayload {
  id: string;
  type: DialogType;
  props?: Record<string, unknown>;
}

/** 弹窗结果。 */
export interface EditorDialogResultPayload {
  id: string;
  cancelled?: boolean;
  data?: unknown;
}

/** 实例就绪 / 销毁。 */
export interface EditorLifecyclePayload {
  el: HTMLElement;
}
